import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useInstitution } from "@/contexts/InstitutionContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, ShieldCheck, ShieldOff, Trash2, Users } from "lucide-react";

interface ProfileRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface MemberRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

interface Props {
  institutionId: string | null;
  institutionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  institute_admin: "Institute Admin",
  instructor: "Instructor",
  student: "Student",
  academy_learner: "Academy Learner",
};

const displayName = (p?: ProfileRow) => {
  if (!p) return "Unknown user";
  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  return name || p.email || "Unnamed user";
};

const InstitutionMembersDialog = ({ institutionId, institutionName, open, onOpenChange, onChanged }: Props) => {
  const { user } = useAuth();
  const { refreshInstitutions } = useInstitution();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<{ user_id: string; role: AppRole; institute_id: string | null }[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [busyUser, setBusyUser] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    setError(null);
    try {
      const [memberRes, profileRes, roleRes] = await Promise.all([
        supabase.from("institution_members").select("id, user_id, status, created_at").eq("institution_id", institutionId),
        supabase.from("profiles").select("user_id, first_name, last_name, email"),
        supabase.from("user_roles").select("user_id, role, institute_id"),
      ]);
      if (memberRes.error) throw memberRes.error;
      if (profileRes.error) throw profileRes.error;
      if (roleRes.error) throw roleRes.error;
      setMembers((memberRes.data || []) as MemberRow[]);
      setProfiles((profileRes.data || []) as ProfileRow[]);
      setRoles((roleRes.data || []) as { user_id: string; role: AppRole; institute_id: string | null }[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    if (open && institutionId) void load();
  }, [open, institutionId, load]);

  const profileMap = useMemo(() => {
    const map = new Map<string, ProfileRow>();
    profiles.forEach((p) => map.set(p.user_id, p));
    return map;
  }, [profiles]);

  const rolesFor = useCallback(
    (userId: string) => roles.filter((r) => r.user_id === userId),
    [roles],
  );

  const isInstituteAdminHere = useCallback(
    (userId: string) =>
      roles.some((r) => r.user_id === userId && r.role === "institute_admin" && r.institute_id === institutionId),
    [roles, institutionId],
  );

  const afterChange = async (affectedUserId?: string) => {
    await load();
    onChanged?.();
    if (affectedUserId && affectedUserId === user?.id) await refreshInstitutions();
  };

  const addMember = async (userId: string) => {
    if (!institutionId) return;
    setBusyUser(userId);
    const { error: insertError } = await supabase
      .from("institution_members")
      .insert({ institution_id: institutionId, user_id: userId, status: "active" });
    setBusyUser(null);
    if (insertError) {
      toast.error(
        insertError.message.includes("duplicate") ? "This user is already a member." : insertError.message,
      );
      return;
    }
    toast.success("Member added");
    setAddSearch("");
    await afterChange(userId);
  };

  const setMemberStatus = async (member: MemberRow, status: string) => {
    setBusyUser(member.user_id);
    const { error: updateError } = await supabase
      .from("institution_members")
      .update({ status })
      .eq("id", member.id);
    setBusyUser(null);
    if (updateError) { toast.error(updateError.message); return; }
    toast.success(status === "active" ? "Membership reactivated" : "Membership deactivated");
    await afterChange(member.user_id);
  };

  const removeMember = async (member: MemberRow) => {
    setBusyUser(member.user_id);
    const { error: deleteError } = await supabase.from("institution_members").delete().eq("id", member.id);
    setBusyUser(null);
    if (deleteError) { toast.error(deleteError.message); return; }
    toast.success("Membership removed");
    await afterChange(member.user_id);
  };

  const grantInstituteAdmin = async (userId: string) => {
    if (!institutionId) return;
    if (isInstituteAdminHere(userId)) { toast.info("User is already an institute admin here."); return; }
    setBusyUser(userId);
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "institute_admin" as AppRole, institute_id: institutionId });
    setBusyUser(null);
    if (roleError) {
      toast.error(
        roleError.message.includes("duplicate")
          ? "User already holds the institute admin role."
          : roleError.message,
      );
      return;
    }
    toast.success("Assigned as institute admin");
    await afterChange(userId);
  };

  const revokeInstituteAdmin = async (userId: string) => {
    if (!institutionId) return;
    setBusyUser(userId);
    const { error: roleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "institute_admin")
      .eq("institute_id", institutionId);
    setBusyUser(null);
    if (roleError) { toast.error(roleError.message); return; }
    toast.success("Institute admin role revoked");
    await afterChange(userId);
  };

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return members;
    return members.filter((m) => {
      const p = profileMap.get(m.user_id);
      return displayName(p).toLowerCase().includes(q) || (p?.email || "").toLowerCase().includes(q);
    });
  }, [members, memberSearch, profileMap]);

  const candidates = useMemo(() => {
    const q = addSearch.toLowerCase().trim();
    if (!q) return [];
    const memberIds = new Set(members.map((m) => m.user_id));
    return profiles
      .filter((p) => !memberIds.has(p.user_id))
      .filter((p) => displayName(p).toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q))
      .slice(0, 6);
  }, [addSearch, profiles, members]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} className="text-primary" /> Members — {institutionName}
          </DialogTitle>
          <DialogDescription>
            Add existing platform users to this institution and manage their institute admin access.
          </DialogDescription>
        </DialogHeader>

        {/* Add member */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder="Search users by name or email to add..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {addSearch.trim() && (
            <div className="rounded-md border border-border">
              {candidates.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">No matching users available.</p>
              ) : (
                candidates.map((p) => (
                  <div key={p.user_id} className="flex items-center justify-between gap-3 border-b border-border p-2.5 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{displayName(p)}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" disabled={busyUser === p.user_id} onClick={() => addMember(p.user_id)}>
                      {busyUser === p.user_id ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Member list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder="Filter current members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" size={22} /></div>
          ) : error ? (
            <div className="space-y-2 py-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {members.length === 0 ? "No members yet. Search above to add an existing user." : "No members match your filter."}
            </p>
          ) : (
            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {filteredMembers.map((m) => {
                const p = profileMap.get(m.user_id);
                const admin = isInstituteAdminHere(m.user_id);
                const busy = busyUser === m.user_id;
                return (
                  <div key={m.id} className="rounded-md border border-border bg-secondary/30 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{displayName(p)}</span>
                          <Badge variant={m.status === "active" ? "default" : "secondary"} className="h-5 text-[10px]">
                            {m.status}
                          </Badge>
                          {admin && <Badge variant="outline" className="h-5 text-[10px]">Institute Admin</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{p?.email || "—"}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rolesFor(m.user_id).length === 0 ? (
                            <span className="text-[11px] text-muted-foreground">No roles</span>
                          ) : (
                            rolesFor(m.user_id).map((r, i) => (
                              <Badge key={`${r.role}-${i}`} variant="secondary" className="h-4 px-1.5 text-[10px]">
                                {ROLE_LABELS[r.role] || r.role}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {admin ? (
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={busy} onClick={() => revokeInstituteAdmin(m.user_id)}>
                            <ShieldOff size={13} /> Revoke Admin
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={busy} onClick={() => grantInstituteAdmin(m.user_id)}>
                            <ShieldCheck size={13} /> Make Admin
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={busy}
                          onClick={() => setMemberStatus(m, m.status === "active" ? "inactive" : "active")}
                        >
                          {m.status === "active" ? "Deactivate" : "Reactivate"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" disabled={busy} onClick={() => removeMember(m)}>
                          {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionMembersDialog;
