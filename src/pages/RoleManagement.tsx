import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShieldCheck, UserPlus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALL_ROLES: AppRole[] = ["super_admin", "institute_admin", "instructor", "student", "academy_learner"];
const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  institute_admin: "Institute Admin",
  instructor: "Instructor",
  student: "Student",
  academy_learner: "Academy Learner",
};

interface UserWithRoles {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  roles: AppRole[];
}

const RoleManagement = () => {
  const { activeRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("student");

  const canManage = activeRole === "super_admin" || activeRole === "institute_admin";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email");
      if (pErr) throw pErr;

      const { data: roleData, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) throw rErr;

      const roleMap = new Map<string, AppRole[]>();
      (roleData || []).forEach((r: { user_id: string; role: AppRole }) => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      const merged: UserWithRoles[] = (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        roles: roleMap.get(p.user_id) || [],
      }));

      setUsers(merged);
    } catch {
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddRole = async (userId: string, role: AppRole) => {
    setAddingRole(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
      toast({ title: "Role assigned", description: `${ROLE_LABELS[role]} role added.` });
      await fetchUsers();
    } catch (err: any) {
      const msg = err?.message?.includes("duplicate") ? "User already has this role." : "Failed to assign role.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAddingRole(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
      toast({ title: "Role removed", description: `${ROLE_LABELS[role]} role removed.` });
      await fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to remove role.", variant: "destructive" });
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.first_name || "").toLowerCase().includes(q) ||
      (u.last_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  if (!canManage) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">You do not have permission to manage roles.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={24} className="text-steel" /> User Role Management
          </h1>
          <p className="text-sm text-muted-foreground">Assign and manage roles for platform users</p>
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">All Users ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-steel" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium text-foreground">
                          {u.first_name || ""} {u.last_name || ""}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="secondary"
                                className="gap-1 text-xs"
                              >
                                {ROLE_LABELS[role]}
                                <button
                                  onClick={() => handleRemoveRole(u.user_id, role)}
                                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                                  title="Remove role"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </Badge>
                            ))}
                            {u.roles.length === 0 && (
                              <span className="text-xs text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                              <SelectTrigger className="h-8 w-36 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs"
                              disabled={addingRole === u.user_id || u.roles.includes(selectedRole)}
                              onClick={() => handleAddRole(u.user_id, selectedRole)}
                            >
                              {addingRole === u.user_id ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                              Add
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
