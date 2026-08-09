import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Clock, MoreVertical, Trash2, Eye, Pencil, Play, CheckCircle2, CalendarClock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type Exam = Tables<"exams">;
type Submission = Pick<Tables<"exam_submissions">, "id" | "exam_id" | "status">;

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-steel/20 text-steel",
  active: "bg-success/20 text-success",
  completed: "bg-warning/20 text-warning",
  archived: "bg-muted text-muted-foreground",
};

type StudentState = "upcoming" | "available" | "in_progress" | "completed" | "expired" | "unavailable";

const studentStateFor = (exam: Exam, subs: Submission[]): StudentState => {
  const now = Date.now();
  if (subs.some((s) => s.status === "in_progress")) return "in_progress";
  if (!["published", "active"].includes(exam.status)) return "unavailable";
  if (exam.end_time && new Date(exam.end_time).getTime() < now) return "expired";
  if (subs.length >= Math.max(exam.attempt_limit ?? 1, 1)) return "completed";
  if (exam.start_time && new Date(exam.start_time).getTime() > now) return "upcoming";
  return "available";
};

const ExamList = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, activeRole } = useAuth();
  const { toast } = useToast();

  const isManager = activeRole === "super_admin" || activeRole === "instructor" || activeRole === "institute_admin";

  const fetchExams = useCallback(async () => {
    const [{ data, error }, { data: subs }] = await Promise.all([
      supabase.from("exams").select("*").order("created_at", { ascending: false }),
      user
        ? supabase.from("exam_submissions").select("id, exam_id, status").eq("student_id", user.id)
        : Promise.resolve({ data: [] as Submission[] } as { data: Submission[] }),
    ]);
    if (!error && data) setExams(data);
    setSubmissions((subs as Submission[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void fetchExams(); }, [fetchExams]);

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" });
    } else {
      setExams((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Exam deleted" });
    }
  };

  const subsFor = useCallback((examId: string) => submissions.filter((s) => s.exam_id === examId), [submissions]);

  const groups = useMemo(() => {
    const result: Record<string, Exam[]> = { in_progress: [], available: [], upcoming: [], completed: [], expired: [] };
    exams.forEach((exam) => {
      const state = studentStateFor(exam, subsFor(exam.id));
      if (state === "unavailable") return;
      result[state].push(exam);
    });
    return result;
  }, [exams, subsFor]);

  const renderStudentCard = (exam: Exam, state: StudentState) => {
    const active = subsFor(exam.id).find((s) => s.status === "in_progress");
    return (
      <div key={exam.id} className="rounded-xl border border-border bg-card-gradient p-5 shadow-card transition-all hover:border-steel/30">
        <div className="mb-3 flex items-start justify-between gap-3">
          <Link to={`/dashboard/exams/${exam.id}`}>
            <h3 className="font-display text-lg font-semibold text-foreground hover:text-steel transition-colors">{exam.title}</h3>
          </Link>
          {state === "available" && <Badge className="bg-success/20 text-success shrink-0">Available</Badge>}
          {state === "in_progress" && <Badge className="bg-warning/20 text-warning shrink-0">In Progress</Badge>}
          {state === "upcoming" && <Badge className="bg-steel/20 text-steel shrink-0">Upcoming</Badge>}
          {state === "completed" && <Badge className="bg-muted text-muted-foreground shrink-0">Completed</Badge>}
          {state === "expired" && <Badge className="bg-muted text-muted-foreground shrink-0">Closed</Badge>}
        </div>
        {exam.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{exam.description}</p>}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration_minutes} min</span>
          <span className="flex items-center gap-1"><FileText size={12} /> {exam.total_marks} marks</span>
          {exam.end_time && state === "available" && (
            <span className="flex items-center gap-1"><CalendarClock size={12} /> Until {new Date(exam.end_time).toLocaleDateString()}</span>
          )}
          {exam.start_time && state === "upcoming" && (
            <span className="flex items-center gap-1"><CalendarClock size={12} /> Starts {new Date(exam.start_time).toLocaleString()}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/dashboard/exams/${exam.id}`}><Eye size={14} /> View Details</Link>
          </Button>
          {state === "available" && (
            <Button asChild variant="hero" size="sm">
              <Link to={`/exam/${exam.id}/start`}><Play size={14} /> Attempt Exam</Link>
            </Button>
          )}
          {state === "in_progress" && active && (
            <Button asChild variant="hero" size="sm">
              <Link to={`/exam/${exam.id}/take`}><Play size={14} /> Continue Exam</Link>
            </Button>
          )}
          {state === "completed" && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/dashboard/exams/${exam.id}`}><CheckCircle2 size={14} /> View Result</Link>
            </Button>
          )}
          {state === "upcoming" && (
            <Button variant="outline" size="sm" disabled><CalendarClock size={14} /> Starts Soon</Button>
          )}
          {state === "expired" && (
            <Button variant="outline" size="sm" disabled><Lock size={14} /> Exam Closed</Button>
          )}
        </div>
      </div>
    );
  };

  const sections: { key: StudentState; label: string }[] = [
    { key: "in_progress", label: "In Progress" },
    { key: "available", label: "Available Exams" },
    { key: "upcoming", label: "Upcoming Exams" },
    { key: "completed", label: "Completed" },
    { key: "expired", label: "Closed" },
  ];

  const totalStudentExams = sections.reduce((n, s) => n + groups[s.key].length, 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Examinations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isManager ? "Create and manage your exams" : "Your assigned and available examinations"}
          </p>
        </div>
        {isManager && (
          <Button asChild variant="hero" size="lg">
            <Link to="/dashboard/exams/create"><Plus size={18} /> Create Exam</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel border-t-transparent" />
        </div>
      ) : isManager ? (
        exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={48} className="text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No exams yet</h2>
            <p className="text-muted-foreground mb-6">Create your first exam to get started</p>
            <Button asChild variant="hero">
              <Link to="/dashboard/exams/create"><Plus size={18} /> Create Exam</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <div key={exam.id} className="rounded-xl border border-border bg-card-gradient p-5 shadow-card transition-all hover:border-steel/30">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={statusColor[exam.status] || ""}>{exam.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground"><MoreVertical size={16} /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/exams/${exam.id}/edit`}><Pencil size={14} className="mr-2" /> Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/exams/${exam.id}`}><Eye size={14} className="mr-2" /> View</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteExam(exam.id)} className="text-destructive">
                        <Trash2 size={14} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link to={`/dashboard/exams/${exam.id}`}>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1 hover:text-steel transition-colors">{exam.title}</h3>
                </Link>
                {exam.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{exam.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration_minutes} min</span>
                  <span className="flex items-center gap-1"><FileText size={12} /> {exam.total_marks} marks</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : totalStudentExams === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={48} className="text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">No examinations yet</h2>
          <p className="text-muted-foreground">Published examinations will appear here when they are available.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => groups[section.key].length > 0 && (
            <section key={section.key}>
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">{section.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups[section.key].map((exam) => renderStudentCard(exam, section.key))}
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExamList;
