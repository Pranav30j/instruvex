import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Send, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyExamCreatorOfSubmission } from "@/lib/notifications";
import { Tables } from "@/integrations/supabase/types";
import CodeEditor from "@/components/exam/CodeEditor";
import ExamDisclaimer from "@/components/exam/ExamDisclaimer";
import { useProctoring } from "@/hooks/use-proctoring";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Exam = Tables<"exams">;

interface QuestionData {
  id: string;
  exam_id: string;
  question_type: string;
  question_text: string;
  marks: number;
  order_index: number;
  code_template: string | null;
  code_language: string | null;
  test_cases: any;
  input_format: string | null;
  output_format: string | null;
  constraints_text: string | null;
  scenario_text: string | null;
  parent_question_id: string | null;
  question_options_student: { id: string; option_text: string; order_index: number; question_id: string }[];
}

interface AnswerMap {
  [questionId: string]: {
    selected_option_id?: string;
    text_answer?: string;
    code_answer?: string;
  };
}

// Group questions: parent case studies with their sub-questions
interface DisplayItem {
  type: "standalone" | "case_study";
  question?: QuestionData;
  scenario?: QuestionData;
  subQuestions?: QuestionData[];
}

const ExamTake = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const { tabSwitches, fullscreenExits } = useProctoring({
    examId: examId || "",
    studentId: user?.id || "",
    submissionId,
    maxTabSwitches: 3,
    onAutoSubmit: () => handleSubmit(),
    enabled: disclaimerAccepted && !loading && !submitting,
  });

  useEffect(() => {
    if (!examId || !user) return;
    const load = async () => {
      const { data: examData } = await supabase.from("exams").select("*").eq("id", examId).single();
      if (!examData) { navigate("/dashboard/exams"); return; }
      setExam(examData);
      setTimeLeft(examData.duration_minutes * 60);

      // Use questions_student view (excludes expected_answer, hidden_test_cases, etc.)
      const { data: qData } = await supabase
        .from("questions_student" as any)
        .select("*, question_options_student(*)")
        .eq("exam_id", examId)
        .order("order_index");

      if (qData) {
        const questions = qData as unknown as QuestionData[];
        const parentMap = new Map<string, QuestionData>();
        const childMap = new Map<string, QuestionData[]>();
        const standalones: QuestionData[] = [];

        for (const q of questions) {
          if (q.question_type === "case_study") {
            parentMap.set(q.id, q);
            if (!childMap.has(q.id)) childMap.set(q.id, []);
          } else if (q.parent_question_id) {
            const kids = childMap.get(q.parent_question_id) || [];
            kids.push(q);
            childMap.set(q.parent_question_id, kids);
          } else {
            standalones.push(q);
          }
        }

        const items: DisplayItem[] = [];
        const processed = new Set<string>();

        for (const q of questions) {
          if (processed.has(q.id)) continue;
          if (q.question_type === "case_study") {
            items.push({
              type: "case_study",
              scenario: q,
              subQuestions: childMap.get(q.id) || [],
            });
            processed.add(q.id);
            (childMap.get(q.id) || []).forEach((c) => processed.add(c.id));
          } else if (!q.parent_question_id) {
            items.push({ type: "standalone", question: q });
            processed.add(q.id);
          }
        }

        if (examData.shuffle_questions) {
          items.sort(() => Math.random() - 0.5);
        }
        setDisplayItems(items);
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

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!submissionId) return;
    const interval = setInterval(async () => {
      for (const [questionId, answer] of Object.entries(answers)) {
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
    }, 30000);
    return () => clearInterval(interval);
  }, [submissionId, answers]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const updateAnswer = (questionId: string, update: Partial<AnswerMap[string]>) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...update } }));
  };

  const handleSubmit = useCallback(async () => {
    if (!submissionId || submitting) return;
    setSubmitting(true);

    for (const [questionId, answer] of Object.entries(answers)) {
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

    const { data: gradeResult, error: gradeError } = await supabase.functions.invoke("grade-exam", {
      body: { submission_id: submissionId },
    });

    const totalScore = gradeResult?.score ?? 0;
    if (gradeError) console.error("Grading error:", gradeError);

    toast({ title: "Exam submitted!", description: `Auto-graded score: ${totalScore}` });

    if (exam?.created_by && user) {
      const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle();
      const studentName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "A student";
      notifyExamCreatorOfSubmission(exam.created_by, exam.title, studentName);
    }
    navigate("/dashboard/exams");
    setSubmitting(false);
  }, [submissionId, answers, submitting, exam, user, toast, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel border-t-transparent" />
      </div>
    );
  }

  if (!exam || displayItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Exam not found or has no questions.</p>
      </div>
    );
  }

  if (!disclaimerAccepted) {
    return <ExamDisclaimer examTitle={exam.title} onAccept={() => setDisclaimerAccepted(true)} />;
  }

  const getAllQuestionIds = (): string[] => {
    const ids: string[] = [];
    for (const item of displayItems) {
      if (item.type === "standalone" && item.question) ids.push(item.question.id);
      else if (item.type === "case_study" && item.subQuestions) {
        item.subQuestions.forEach((sq) => ids.push(sq.id));
      }
    }
    return ids;
  };

  const answeredCount = getAllQuestionIds().filter((id) => {
    const a = answers[id];
    return a?.selected_option_id || a?.text_answer?.trim() || a?.code_answer?.trim();
  }).length;

  const totalQuestions = getAllQuestionIds().length;
  const isUrgent = timeLeft < 300;
  const currentItem = displayItems[currentIdx];

  const renderQuestion = (q: QuestionData, prefix?: string) => (
    <div key={q.id} className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {prefix && <span className="text-sm font-medium text-steel">{prefix}</span>}
        <Badge variant="outline" className="text-xs">{q.question_type.replace("_", " ").toUpperCase()}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-xl border border-border bg-card-gradient p-5 shadow-card mb-4">
        <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">{q.question_text}</p>
      </div>

      {/* MCQ */}
      {q.question_type === "mcq" && (
        <div className="space-y-2">
          {(q.question_options_student || [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((opt) => {
              const selected = answers[q.id]?.selected_option_id === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => updateAnswer(q.id, { selected_option_id: opt.id })}
                  className={`w-full rounded-lg border p-4 text-left text-sm transition-all ${
                    selected ? "border-steel bg-steel/10 text-foreground" : "border-border bg-card hover:border-steel/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.option_text}
                </button>
              );
            })}
        </div>
      )}

      {/* Short Answer */}
      {q.question_type === "short_answer" && (
        <Input
          value={answers[q.id]?.text_answer || ""}
          onChange={(e) => updateAnswer(q.id, { text_answer: e.target.value })}
          placeholder="Type your short answer..."
        />
      )}

      {/* Long Answer / Subjective */}
      {(q.question_type === "long_answer" || q.question_type === "subjective") && (
        <Textarea
          value={answers[q.id]?.text_answer || ""}
          onChange={(e) => updateAnswer(q.id, { text_answer: e.target.value })}
          placeholder="Write your detailed answer..."
          rows={10}
        />
      )}

      {/* Coding */}
      {q.question_type === "coding" && (
        <div className="space-y-3">
          {(q.input_format || q.output_format || q.constraints_text) && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-2">
              {q.input_format && <div><span className="font-medium text-foreground">Input Format:</span> <span className="text-muted-foreground">{q.input_format}</span></div>}
              {q.output_format && <div><span className="font-medium text-foreground">Output Format:</span> <span className="text-muted-foreground">{q.output_format}</span></div>}
              {q.constraints_text && <div><span className="font-medium text-foreground">Constraints:</span> <span className="text-muted-foreground">{q.constraints_text}</span></div>}
            </div>
          )}
          <CodeEditor
            code={answers[q.id]?.code_answer || q.code_template || ""}
            language={q.code_language || "python"}
            onCodeChange={(code) => updateAnswer(q.id, { code_answer: code })}
            testCases={Array.isArray(q.test_cases) ? q.test_cases : []}
            readOnlyLanguage
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">{exam.title}</h1>
          <p className="text-xs text-muted-foreground">{answeredCount}/{totalQuestions} answered</p>
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
                  You've answered {answeredCount} of {totalQuestions} questions. This action cannot be undone.
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
        {/* Navigation sidebar */}
        <aside className="hidden w-20 flex-col items-center gap-2 border-r border-border bg-card p-3 md:flex overflow-y-auto">
          {displayItems.map((item, i) => {
            let answered = false;
            if (item.type === "standalone" && item.question) {
              const a = answers[item.question.id];
              answered = !!(a?.selected_option_id || a?.text_answer?.trim() || a?.code_answer?.trim());
            } else if (item.type === "case_study" && item.subQuestions) {
              answered = item.subQuestions.every((sq) => {
                const a = answers[sq.id];
                return a?.selected_option_id || a?.text_answer?.trim() || a?.code_answer?.trim();
              });
            }
            return (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  i === currentIdx
                    ? "bg-steel text-primary-foreground shadow-glow"
                    : answered
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.type === "case_study" ? <BookOpen size={14} /> : i + 1}
              </button>
            );
          })}
        </aside>

        {/* Question area */}
        <div className="flex-1 p-6 max-w-4xl mx-auto">
          {currentItem && currentItem.type === "standalone" && currentItem.question && (
            renderQuestion(currentItem.question, `Question ${currentIdx + 1}`)
          )}

          {currentItem && currentItem.type === "case_study" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <BookOpen size={12} /> CASE STUDY
                </Badge>
              </div>
              {currentItem.scenario?.scenario_text && (
                <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card mb-6">
                  <h3 className="font-display text-sm font-semibold text-steel mb-2">Scenario</h3>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{currentItem.scenario.scenario_text}</p>
                </div>
              )}
              {currentItem.subQuestions?.map((sq, si) =>
                renderQuestion(sq, `Q${currentIdx + 1}.${si + 1}`)
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0}>
              <ChevronLeft size={16} /> Previous
            </Button>
            <div className="flex gap-1 md:hidden overflow-x-auto">
              {displayItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`h-8 w-8 rounded text-xs font-medium ${
                    i === currentIdx ? "bg-steel text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setCurrentIdx((i) => Math.min(displayItems.length - 1, i + 1))} disabled={currentIdx === displayItems.length - 1}>
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTake;
