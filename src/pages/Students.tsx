import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Search, GraduationCap, Trophy, Clock, Loader2, UserCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface StudentRow {
  student_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  total_submissions: number;
  avg_score: number | null;
  last_submission_at: string | null;
}

const Students = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["my-students", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_students", {
        _creator_id: user!.id,
      });
      if (error) throw error;
      return (data ?? []) as StudentRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [students, search]);

  const totalSubmissions = students.reduce((a, s) => a + s.total_submissions, 0);
  const avgScore =
    students.length > 0
      ? (
          students.reduce((a, s) => a + (s.avg_score ?? 0), 0) / students.length
        ).toFixed(1)
      : "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">
            View and manage students enrolled in your exams
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Users,
              label: "Total Students",
              value: students.length,
              color: "text-primary",
            },
            {
              icon: GraduationCap,
              label: "Total Submissions",
              value: totalSubmissions,
              color: "text-[hsl(var(--cyan-accent))]",
            },
            {
              icon: Trophy,
              label: "Avg Score",
              value: avgScore,
              color: "text-[hsl(var(--success))]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
            <Users size={40} className="mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {students.length === 0
                ? "No students have taken your exams yet"
                : "No students match your search"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.student_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {s.avatar_url ? (
                          <img
                            src={s.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                            <UserCircle size={18} className="text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {s.first_name || s.last_name
                              ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim()
                              : "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">{s.email ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{s.total_submissions}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-foreground">
                        {s.avg_score != null ? s.avg_score : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {s.last_submission_at
                          ? format(new Date(s.last_submission_at), "MMM d, yyyy")
                          : "—"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Students;
