import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Institution {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  primary_color: string | null;
  status: string | null;
}

interface InstitutionContextType {
  activeInstitution: Institution | null;
  activeInstitutionId: string | null;
  userInstitutions: Institution[];
  loading: boolean;
  refreshInstitutions: () => Promise<void>;
  switchInstitution: (institutionId: string) => void;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

const ACTIVE_INSTITUTION_KEY = "instruvex_active_institution";

const INSTITUTION_FIELDS = "id, name, slug, logo_url, primary_color, status";

const sortByName = (list: Institution[]) =>
  [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

const dedupe = (list: Institution[]) => {
  const map = new Map<string, Institution>();
  list.forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  return Array.from(map.values());
};

export const InstitutionProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile, hasRole, loading: authLoading } = useAuth();
  const [userInstitutions, setUserInstitutions] = useState<Institution[]>([]);
  const [activeInstitutionId, setActiveInstitutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = hasRole("super_admin");

  const resolveActive = useCallback((list: Institution[]) => {
    if (list.length === 0) {
      setActiveInstitutionId(null);
      localStorage.removeItem(ACTIVE_INSTITUTION_KEY);
      return;
    }
    const stored = localStorage.getItem(ACTIVE_INSTITUTION_KEY);
    const next = (stored && list.some((i) => i.id === stored) ? stored : list[0].id);
    setActiveInstitutionId(next);
    localStorage.setItem(ACTIVE_INSTITUTION_KEY, next);
  }, []);

  const loadInstitutions = useCallback(async () => {
    if (!user?.id) {
      setUserInstitutions([]);
      setActiveInstitutionId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const collected: Institution[] = [];

      // Super admins can operate across every institution — never lock them out.
      if (isSuperAdmin) {
        const { data } = await supabase
          .from("institutes")
          .select(INSTITUTION_FIELDS)
          .order("name");
        if (data) collected.push(...(data as Institution[]));
      }

      const { data: memberships } = await supabase
        .from("institution_members")
        .select(`institution_id, status, institutes:institution_id (${INSTITUTION_FIELDS})`)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (memberships) {
        memberships.forEach((row: { institutes: Institution | null }) => {
          if (row.institutes) collected.push(row.institutes);
        });
      }

      // Backward compatibility: fall back to the legacy profiles.institute_id link.
      if (collected.length === 0 && profile?.institute_id) {
        const { data } = await supabase
          .from("institutes")
          .select(INSTITUTION_FIELDS)
          .eq("id", profile.institute_id)
          .maybeSingle();
        if (data) collected.push(data as Institution);
      }

      const list = sortByName(dedupe(collected));
      setUserInstitutions(list);
      resolveActive(list);
    } catch {
      setUserInstitutions([]);
      setActiveInstitutionId(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.institute_id, isSuperAdmin, resolveActive]);

  useEffect(() => {
    if (authLoading) return;
    void loadInstitutions();
  }, [authLoading, loadInstitutions]);

  const switchInstitution = useCallback((institutionId: string) => {
    setUserInstitutions((current) => {
      if (!current.some((i) => i.id === institutionId)) return current;
      setActiveInstitutionId(institutionId);
      localStorage.setItem(ACTIVE_INSTITUTION_KEY, institutionId);
      return current;
    });
  }, []);

  const activeInstitution = useMemo(
    () => userInstitutions.find((i) => i.id === activeInstitutionId) ?? null,
    [userInstitutions, activeInstitutionId],
  );

  const value = useMemo(
    () => ({
      activeInstitution,
      activeInstitutionId,
      userInstitutions,
      loading,
      refreshInstitutions: loadInstitutions,
      switchInstitution,
    }),
    [activeInstitution, activeInstitutionId, userInstitutions, loading, loadInstitutions, switchInstitution],
  );

  return <InstitutionContext.Provider value={value}>{children}</InstitutionContext.Provider>;
};

export const useInstitution = () => {
  const context = useContext(InstitutionContext);
  if (!context) throw new Error("useInstitution must be used within InstitutionProvider");
  return context;
};
