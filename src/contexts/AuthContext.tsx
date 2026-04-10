import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "institute_admin" | "instructor" | "student" | "academy_learner";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  institute_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  loading: boolean;
  refreshRoles: () => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearLocalSession: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  switchRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_ROLE_KEY = "instruvex_active_role";
const BOOTSTRAP_ADMIN_EMAIL = "venusboss681@gmail.com";

const ROLE_PRIORITY: AppRole[] = ["super_admin", "institute_admin", "instructor", "student", "academy_learner"];

const isNetworkFetchError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message).toLowerCase() : "";
  return message.includes("failed to fetch") || message.includes("network");
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocalSession = async () => {
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
    setActiveRole(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  const normalizeRoles = useCallback((userRoles: AppRole[]) => {
    const uniqueRoles = new Set(userRoles);
    return ROLE_PRIORITY.filter((role) => uniqueRoles.has(role));
  }, []);

  const resolveActiveRole = (userRoles: AppRole[]): AppRole | null => {
    if (userRoles.length === 0) return null;
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY) as AppRole | null;
    if (stored && userRoles.includes(stored)) return stored;
    // Pick highest priority role
    for (const r of ROLE_PRIORITY) {
      if (userRoles.includes(r)) return r;
    }
    return userRoles[0];
  };

  const applyRoles = useCallback((nextRoles: AppRole[]) => {
    const normalizedRoles = normalizeRoles(nextRoles);
    setRoles(normalizedRoles);

    const active = resolveActiveRole(normalizedRoles);
    setActiveRole(active);

    if (active) {
      localStorage.setItem(ACTIVE_ROLE_KEY, active);
    } else {
      localStorage.removeItem(ACTIVE_ROLE_KEY);
    }

    return normalizedRoles;
  }, [normalizeRoles]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    setProfile(data as Profile | null);
  };

  const fetchRolesFromBackend = useCallback(async (userId: string) => {
    const { data, error } = await supabase.rpc("get_user_roles", { _user_id: userId });

    if (error) throw error;
    return normalizeRoles((data || []) as AppRole[]);
  }, [normalizeRoles]);

  const fetchRoles = useCallback(async (userId: string, userEmail?: string | null) => {
    const initialRoles = await fetchRolesFromBackend(userId);
    const isBootstrapAdmin = userEmail?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
    const needsRecovery = initialRoles.length === 0 || (isBootstrapAdmin && !initialRoles.includes("super_admin"));

    if (!needsRecovery) {
      return applyRoles(initialRoles);
    }

    try {
      const { data, error } = await supabase.functions.invoke("recover-admin");

      if (error) throw error;

      const recoveredRoles = normalizeRoles(((data?.result?.roles as AppRole[] | undefined) || []));
      if (recoveredRoles.length > 0) {
        return applyRoles(recoveredRoles);
      }
    } catch {
      // Fall back to a fresh backend fetch below.
    }

    const refreshedRoles = await fetchRolesFromBackend(userId);
    return applyRoles(refreshedRoles);
  }, [applyRoles, fetchRolesFromBackend, normalizeRoles]);

  const refreshRoles = useCallback(async () => {
    if (!user?.id) return;
    await fetchRoles(user.id, user.email);
  }, [fetchRoles, user]);

  const hydrateSessionState = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      setRoles([]);
      setActiveRole(null);
      setLoading(false);
      return;
    }

    try {
      await Promise.all([
        fetchProfile(nextSession.user.id),
        fetchRoles(nextSession.user.id, nextSession.user.email),
      ]);
    } catch (error) {
      if (isNetworkFetchError(error)) {
        await clearLocalSession();
      } else {
        setProfile(null);
        setRoles([]);
        setActiveRole(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateSessionState(nextSession);
    });

    void (async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (isNetworkFetchError(error)) {
          await clearLocalSession();
        }
        setLoading(false);
        return;
      }

      await hydrateSessionState(data.session);
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
          emailRedirectTo: "https://instruvex.in",
        },
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      await clearLocalSession();
      return;
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
    setActiveRole(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const switchRole = (role: AppRole) => {
    if (!roles.includes(role)) return;
    setActiveRole(role);
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, roles, activeRole, loading, refreshRoles, signUp, signIn, signOut, clearLocalSession, hasRole, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
