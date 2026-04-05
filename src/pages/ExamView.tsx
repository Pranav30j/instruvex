import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Play, Clock, FileText, Users, Pencil, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

type Exam = Tables<"exams">;
type Question = Tables<"questions">;

const ExamView = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionCount, setSubmissionCount] = useState(0);

  useEffect(() => {
    if (!examId) return;
    const load = async () => {
      const [{ data: examData }, { data: qData }, { count }] = await Promise.all([
        supabase.from("exams").select("*").eq("id", examId).single(),
        supabase.from("questions").select("*").eq("exam_id", examId).order("order_index"),
        supabase.from("exam_submissions").select("*", { count: "exact", head: true }).eq("exam_id", examId),
      ]);
      setExam(examData);
      setQuestions(qData || []);
      setSubmissionCount(count || 0);
      setLoading(false);
    };
    load();
  }, [examId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Exam not found.</p>
      </DashboardLayout>
    );
  }

  const isCreator = user?.id === exam.created_by;
  const canTake = !isCreator && ["published", "active"].includes(exam.status);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/exams")}><ArrowLeft size={18} /></Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{exam.title}</h1>
            {exam.description && <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>}
          </div>
          <Badge className="capitalize">{exam.status}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-border bg-card-gradient p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock size={14} /> Duration</div>
            <p className="font-display text-xl font-bold text-foreground">{exam.duration_minutes} min</p>
          </div>
          <div className="rounded-xl border border-border bg-card-gradient p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><FileText size={14} /> Questions</div>
            <p className="font-display text-xl font-bold text-foreground">{questions.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card-gradient p-4 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><Users size={14} /> Submissions</div>
            <p className="font-display text-xl font-bold text-foreground">{submissionCount}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          {canTake && (
            <Button variant="hero" size="lg" asChild>
              <Link to={`/exam/${examId}/take`}><Play size={16} /> Start Exam</Link>
            </Button>
          )}
          {isCreator && (
            <>
              <Button variant="outline" size="lg" asChild>
                <Link to={`/dashboard/exams/${examId}/edit`}><Pencil size={16} /> Edit Exam</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to={`/dashboard/exams/${examId}/security`}><Shield size={16} /> Security Report</Link>
              </Button>
            </>
          )}
        </div>

        {/* Questions list (for creator) */}
        {isCreator && questions.length > 0 && (
          <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Questions</h2>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className="text-sm font-medium text-steel w-8">Q{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground line-clamp-1">{q.question_text}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{q.question_type}</Badge>
                  <span className="text-xs text-muted-foreground">{q.marks}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamView;
