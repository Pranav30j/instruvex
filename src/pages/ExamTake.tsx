import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyExamCreatorOfSubmission } from "@/lib/notifications";
import { Tables } from "@/integrations/supabase/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Exam = Tables<"exams">;
type Question = Tables<"questions">;
type Option = Tables<"question_options">;

interface QuestionWithOptions extends Question {
  question_options: Option[];
}

interface AnswerMap {
  [questionId: string]: {
    selected_option_id?: string;
    text_answer?: string;
    code_answer?: string;
  };
}

const ExamTake = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch exam and questions
  useEffect(() => {
    if (!examId || !user) return;
    const load = async () => {
      const { data: examData } = await supabase.from("exams").select("*").eq("id", examId).single();
      if (!examData) { navigate("/dashboard/exams"); return; }
      setExam(examData);
      setTimeLeft(examData.duration_minutes * 60);

      const { data: qData } = await supabase
        .from("questions")
        .select("*, question_options(*)")
        .eq("exam_id", examId)
        .order("order_index");
      if (qData) {
        const sorted = examData.shuffle_questions
          ? [...qData].sort(() => Math.random() - 0.5)
          : qData;
        setQuestions(sorted as QuestionWithOptions[]);
      }

      // Create or resume submission
      const { data: existing } = await supabase
        .from("exam_submissions")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (existing) {
        setSubmissionId(existing.id);
        // Load existing answers
        const { data: savedAnswers } = await supabase
          .from("student_answers")
          .select("*")
          .eq("submission_id", existing.id);
        if (savedAnswers) {
          const map: AnswerMap = {};
          savedAnswers.forEach((a) => {
            map[a.question_id] = {
              selected_option_id: a.selected_option_id || undefined,
              text_answer: a.text_answer || undefined,
              code_answer: a.code_answer || undefined,
            };
          });
          setAnswers(map);
        }
      } else {
        const { data: sub } = await supabase
          .from("exam_submissions")
          .insert({ exam_id: examId, student_id: user.id })
          .select()
          .single();
        if (sub) setSubmissionId(sub.id);
      }
      setLoading(false);
    };
    load();
  }, [examId, user]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIdx];

  const updateAnswer = (questionId: string, update: Partial<AnswerMap[string]>) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...update } }));
  };

  const handleSubmit = useCallback(async () => {
    if (!submissionId || submitting) return;
    setSubmitting(true);

    // Save all answers
    for (const [questionId, answer] of Object.entries(answers)) {
      // Upsert answer
      const { data: existing } = await supabase
        .from("student_answers")
        .select("id")
        .eq("submission_id", submissionId)
        .eq("question_id", questionId)
        .maybeSingle();

      if (existing) {
        await supabase.from("student_answers").update({
          selected_option_id: answer.selected_option_id || null,
          text_answer: answer.text_answer || null,
          code_answer: answer.code_answer || null,
        }).eq("id", existing.id);
      } else {
        await supabase.from("student_answers").insert({
          submission_id: submissionId,
          question_id: questionId,
          selected_option_id: answer.selected_option_id || null,
          text_answer: answer.text_answer || null,
          code_answer: answer.code_answer || null,
        });
      }
    }

    // Auto-grade MCQs
    let totalScore = 0;
    for (const q of questions) {
      if (q.question_type === "mcq") {
        const ans = answers[q.id];
        if (ans?.selected_option_id) {
          const correctOpt = q.question_options.find((o) => o.is_correct);
          if (correctOpt && correctOpt.id === ans.selected_option_id) {
            totalScore += q.marks;
          }
        }
      }
    }

    await supabase.from("exam_submissions").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      total_score: totalScore,
    }).eq("id", submissionId);

    toast({ title: "Exam submitted!", description: `Auto-graded MCQ score: ${totalScore}` });
    // Notify exam creator
    if (exam?.created_by && user) {
      const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle();
      const studentName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "A student";
      notifyExamCreatorOfSubmission(exam.created_by, exam.title, studentName);
    }
    navigate("/dashboard/exams");
    setSubmitting(false);
  }, [submissionId, answers, questions, submitting, exam, user, toast, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel border-t-transparent" />
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Exam not found or has no questions.</p>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter((k) => {
    const a = answers[k];
    return a.selected_option_id || a.text_answer?.trim() || a.code_answer?.trim();
  }).length;

  const isUrgent = timeLeft < 300;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-navy-deep px-4 py-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">{exam.title}</h1>
          <p className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold ${
            isUrgent ? "bg-destructive/20 text-destructive animate-pulse" : "bg-steel/10 text-steel"
          }`}>
            <Clock size={14} /> {formatTime(timeLeft)}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="hero" size="sm" disabled={submitting}>
                <Send size={14} /> Submit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                <AlertDialogDescription>
                  You've answered {answeredCount} of {questions.length} questions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Question navigation sidebar */}
        <aside className="hidden w-20 flex-col items-center gap-2 border-r border-border bg-navy-deep p-3 md:flex overflow-y-auto">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const answered = !!(a?.selected_option_id || a?.text_answer?.trim() || a?.code_answer?.trim());
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  i === currentIdx
                    ? "bg-steel text-primary-foreground shadow-glow"
                    : answered
                    ? "bg-success/20 text-success"
                    : "bg-navy-elevated text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </aside>

        {/* Question area */}
        <div className="flex-1 p-6 max-w-4xl mx-auto">
          {currentQ && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-steel">Question {currentIdx + 1}</span>
                <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
                  {currentQ.question_type.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""}</span>
              </div>

              <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card mb-6">
                <p className="text-foreground text-lg leading-relaxed">{currentQ.question_text}</p>
              </div>

              {/* MCQ */}
              {currentQ.question_type === "mcq" && (
                <div className="space-y-2">
                  {currentQ.question_options
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((opt) => {
                      const selected = answers[currentQ.id]?.selected_option_id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => updateAnswer(currentQ.id, { selected_option_id: opt.id })}
                          className={`w-full rounded-lg border p-4 text-left text-sm transition-all ${
                            selected
                              ? "border-steel bg-steel/10 text-foreground"
                              : "border-border bg-card hover:border-steel/30 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt.option_text}
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Subjective */}
              {currentQ.question_type === "subjective" && (
                <Textarea
                  value={answers[currentQ.id]?.text_answer || ""}
                  onChange={(e) => updateAnswer(currentQ.id, { text_answer: e.target.value })}
                  placeholder="Type your answer here..."
                  rows={8}
                />
              )}

              {/* Coding */}
              {currentQ.question_type === "coding" && (
                <div>
                  {currentQ.code_language && (
                    <p className="text-xs text-muted-foreground mb-2">Language: {currentQ.code_language}</p>
                  )}
                  {currentQ.code_template && (
                    <div className="rounded-lg border border-border bg-navy-deep p-4 mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Template:</p>
                      <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">{currentQ.code_template}</pre>
                    </div>
                  )}
                  <Textarea
                    value={answers[currentQ.id]?.code_answer || currentQ.code_template || ""}
                    onChange={(e) => updateAnswer(currentQ.id, { code_answer: e.target.value })}
                    placeholder="Write your code here..."
                    className="font-mono text-sm"
                    rows={12}
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                >
                  <ChevronLeft size={16} /> Previous
                </Button>

                {/* Mobile question nav */}
                <div className="flex gap-1 md:hidden overflow-x-auto">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`h-8 w-8 rounded text-xs font-medium ${
                        i === currentIdx ? "bg-steel text-primary-foreground" : "bg-navy-elevated text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIdx === questions.length - 1}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamTake;
