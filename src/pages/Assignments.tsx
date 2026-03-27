import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, BookOpen, Loader2, FileText } from "lucide-react";
import { format, isPast } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  submitted: "bg-green-500/10 text-green-400 border-green-500/20",
  late: "bg-red-500/10 text-red-400 border-red-500/20",
  graded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const Assignments = () => {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const isCreator = activeRole && ["super_admin", "institute_admin", "instructor"].includes(activeRole);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments", activeRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, academy_courses(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["my-submissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, status, submitted_at")
        .eq("student_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user && activeRole === "student",
  });

  const getSubmissionStatus = (assignmentId: string, dueDate: string | null) => {
    const sub = mySubmissions.find((s) => s.assignment_id === assignmentId);
    if (sub) return sub.status === "graded" ? "graded" : "submitted";
    if (dueDate && isPast(new Date(dueDate))) return "late";
    return "pending";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Assignments</h1>
            <p className="text-sm text-muted-foreground">
              {isCreator ? "Create and manage assignments" : "View and submit your assignments"}
            </p>
          </div>
          {isCreator && (
            <Button className="gap-2" onClick={() => navigate("/dashboard/assignments/create")}>
              <Plus className="h-4 w-4" /> Create Assignment
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="border-border bg-card shadow-card">
            <CardContent className="py-20 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-1 font-display text-lg font-semibold text-foreground">No assignments yet</h3>
              <p className="text-sm text-muted-foreground">
                {isCreator ? "Click 'Create Assignment' to get started." : "No assignments have been posted yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a: any) => {
              const status = activeRole === "student" ? getSubmissionStatus(a.id, a.due_date) : a.status;
              return (
                <Card
                  key={a.id}
                  className="cursor-pointer border-border bg-card shadow-card transition-all hover:border-steel/40 hover:shadow-glow"
                  onClick={() => navigate(`/dashboard/assignments/${a.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2 text-base font-semibold text-foreground">
                        {a.title}
                      </CardTitle>
                      <Badge variant="outline" className={statusColors[status] || statusColors.pending}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {(a as any).academy_courses?.title && (
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} />
                        <span className="truncate">{(a as any).academy_courses.title}</span>
                      </div>
                    )}
                    {a.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{format(new Date(a.due_date), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    )}
                    {a.max_marks && (
                      <span className="text-xs">Max Marks: {a.max_marks}</span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
