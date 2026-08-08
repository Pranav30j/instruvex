import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock, CloudOff, Eraser, Flag,
  Loader2, Maximize, Send, Shield, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyExamCreatorOfSubmission } from "@/lib/notifications";
import CodeEditor from "@/components/exam/CodeEditor";
import QuestionPalette, { PaletteItem } from "@/components/exam/QuestionPalette";
import ProctoringMonitor from "@/components/exam/ProctoringMonitor";
import { useExamSecurity } from "@/hooks/use-exam-security";
import { ExamSecuritySettings, parseSecuritySettings } from "@/lib/exam-security";

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
  question_options_student: { id: string; option_text: string; order_index: number }[];
}

interface Answer {
  selected_option_id?: string | null;
  text_answer?: string | null;
  code_answer?: string | null;
}

interface DisplayItem {
  type: "standalone" | "case_study";
  question?: QuestionData;
  scenario?: QuestionData;
  subQuestions?: QuestionData[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const isAnswered = (a?: Answer) =>
  !!(a && (a.selected_option_id || a.text_answer?.trim() || a.code_answer?.trim()));

const formatClock = (seconds: number) => {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const ExamTake = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [exam, setExam] = useState<any>(null);
  const [settings, setSettings] = useState<ExamSecuritySettings | null>(null);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const answerRowIds = useRef<Record<string, string>>({});
  const dirty = useRef<Set<string>>(new Set());
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const submittedRef = useRef(false);
  const warnedAt = useRef<Set<number>>(new Set());

  // ---------------------------------------------------------------- loading
  useEffect(() => {
    if (!examId || !user) return;
    let cancelled = false;

    const load = async () => {
      const { data: examData } = await supabase.from("exams").select("*").eq("id", examId).maybeSingle();
      if (!examData) {
        navigate("/dashboard/exams", { replace: true });
        return;
      }

      const { data: submission } = await supabase
        .from("exam_submissions")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .maybeSingle();

      // No active attempt — the student must go through the start flow.
      if (!submission) {
        navigate(`/exam/${examId}/start`, { replace: true });
        return;
      }

      const { data: qData } = await supabase
        .from("questions_student" as any)
        .select("*, question_options_student(*)")
        .eq("exam_id", examId)
        .order("order_index");

      const questions = (qData || []) as unknown as QuestionData[];
      const childMap = new Map<string, QuestionData[]>();
      questions.forEach((q) => {
        if (q.parent_question_id) {
          const kids = childMap.get(q.parent_question_id) || [];
          kids.push(q);
          childMap.set(q.parent_question_id, kids);
        }
      });

      const built: DisplayItem[] = [];
      questions.forEach((q) => {
        if (q.question_type === "case_study") {
          built.push({ type: "case_study", scenario: q, subQuestions: childMap.get(q.id) || [] });
        } else if (!q.parent_question_id) {
          built.push({ type: "standalone", question: q });
        }
      });

      const { data: saved } = await supabase
        .from("student_answers")
        .select("*")
        .eq("submission_id", submission.id);

      const answerMap: Record<string, Answer> = {};
      (saved || []).forEach((row) => {
        answerRowIds.current[row.question_id] = row.id;
        answerMap[row.question_id] = {
          selected_option_id: row.selected_option_id,
          text_answer: row.text_answer,
          code_answer: row.code_answer,
        };
      });

      if (cancelled) return;

      const sub = submission as any;
      setExam(examData);
      setSettings(parseSecuritySettings((examData as any).security_settings));
      setItems(built);
      setSubmissionId(submission.id);
      setAnswers(answerMap);
      setMarked(Array.isArray(sub.marked_for_review) ? sub.marked_for_review : []);
      setCurrentIdx(Math.min(sub.current_question_index || 0, Math.max(built.length - 1, 0)));
      setExpiresAt(
        sub.expires_at
          ? new Date(sub.expires_at).getTime()
          : new Date(sub.started_at).getTime() + examData.duration_minutes * 60_000,
      );
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [examId, user, navigate]);

  // ------------------------------------------------------------- persistence
  const flushAnswers = useCallback(async () => {
    if (!submissionId || dirty.current.size === 0) return;
    const pending = Array.from(dirty.current);
    dirty.current.clear();
    setSaveStatus("saving");

    try {
      for (const questionId of pending) {
        const answer = answersRef.current[questionId] || {};
        const payload = {
          selected_option_id: answer.selected_option_id || null,
          text_answer: answer.text_answer || null,
          code_answer: answer.code_answer || null,
        };
        const existingId = answerRowIds.current[questionId];
        if (existingId) {
          const { error } = await supabase.from("student_answers").update(payload).eq("id", existingId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("student_answers")
            .insert({ submission_id: submissionId, question_id: questionId, ...payload })
            .select("id")
            .single();
          if (error) throw error;
          if (data) answerRowIds.current[questionId] = data.id;
        }
      }
      setSaveStatus("saved");
    } catch {
      // Re-queue so the answers sync when connectivity returns.
      pending.forEach((id) => dirty.current.add(id));
      setSaveStatus("error");
    }
  }, [submissionId]);

  const queueSave = useCallback(
    (questionId: string) => {
      dirty.current.add(questionId);
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void flushAnswers(), 800);
    },
    [flushAnswers],
  );

  // Retry queued answers periodically (covers offline periods).
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirty.current.size > 0 && navigator.onLine) void flushAnswers();
    }, 10_000);
    return () => clearInterval(interval);
  }, [flushAnswers]);

  const updateAnswer = useCallback(
    (questionId: string, update: Answer) => {
      setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...update } }));
      queueSave(questionId);
    },
    [queueSave],
  );

  // Persist navigation position and review marks (best effort).
  const persistProgress = useCallback(
    (index: number, reviewList: string[]) => {
      if (!submissionId) return;
      void supabase
        .from("exam_submissions")
        .update({ current_question_index: index, marked_for_review: reviewList } as any)
        .eq("id", submissionId);
    },
    [submissionId],
  );

  // ------------------------------------------------------------- submission
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!submissionId || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      await flushAnswers();

      const { data, error } = await supabase.functions.invoke("grade-exam", {
        body: { submission_id: submissionId, auto_submitted: auto },
      });

      if (error) {
        submittedRef.current = false;
        setSubmitting(false);
        toast({
          title: "Submission failed",
          description: "Your answers are saved. Please check your connection and try again.",
          variant: "destructive",
        });
        return;
      }

      if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {});

      if (exam?.created_by && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle();
        const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "A student";
        notifyExamCreatorOfSubmission(exam.created_by, exam.title, name);
      }

      toast({
        title: auto ? "Time expired" : "Examination submitted",
        description: auto ? "Your answers were submitted automatically." : "Your attempt has been recorded.",
      });
      navigate(`/dashboard/exams/${examId}`, { replace: true });
    },
    [submissionId, flushAnswers, exam, user, toast, navigate, examId],
  );

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  // ---------------------------------------------------------------- security
  const activeSettings = settings;
  const security = useExamSecurity({
    examId: examId || "",
    studentId: user?.id || "",
    submissionId,
    settings: activeSettings || parseSecuritySettings(null),
    enabled: !loading && !!activeSettings && !submitting,
    onViolationLimit: useCallback(() => {
      toast({
        title: "Security limit reached",
        description: "Your examination has been submitted automatically as configured by your institution.",
        variant: "destructive",
      });
      void handleSubmitRef.current(true);
    }, [toast]),
  });

  const recordEvent = security.record;

  // ------------------------------------------------------------------- timer
  useEffect(() => {
    if (loading || !expiresAt) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [loading, expiresAt]);

  const secondsLeft = expiresAt ? Math.floor((expiresAt - now) / 1000) : 0;

  useEffect(() => {
    if (loading || !expiresAt || submittedRef.current) return;
    if (secondsLeft <= 0) {
      void handleSubmitRef.current(true);
      return;
    }
    const minutes = Math.ceil(secondsLeft / 60);
    if ([10, 5, 1].includes(minutes) && !warnedAt.current.has(minutes) && secondsLeft % 60 === 0) {
      warnedAt.current.add(minutes);
      toast({
        title: `${minutes} minute${minutes > 1 ? "s" : ""} remaining`,
        description: "Please review your answers and submit before the timer ends.",
      });
    }
  }, [secondsLeft, loading, expiresAt, toast]);

  // -------------------------------------------------------------- derivation
  const allQuestionIds = useMemo(() => {
    const ids: string[] = [];
    items.forEach((item) => {
      if (item.type === "standalone" && item.question) ids.push(item.question.id);
      if (item.type === "case_study") item.subQuestions?.forEach((sq) => ids.push(sq.id));
    });
    return ids;
  }, [items]);

  const paletteItems: PaletteItem[] = useMemo(
    () =>
      items.map((item, index) => {
        const ids =
          item.type === "standalone" && item.question
            ? [item.question.id]
            : (item.subQuestions || []).map((sq) => sq.id);
        return {
          index,
          answered: ids.length > 0 && ids.every((id) => isAnswered(answers[id])),
          marked: ids.some((id) => marked.includes(id)),
          isCaseStudy: item.type === "case_study",
        };
      }),
    [items, answers, marked],
  );

  const answeredCount = allQuestionIds.filter((id) => isAnswered(answers[id])).length;
  const totalQuestions = allQuestionIds.length;

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    setCurrentIdx(next);
    persistProgress(next, marked);
  };

  const toggleMark = (questionId: string) => {
    setMarked((prev) => {
      const next = prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId];
      persistProgress(currentIdx, next);
      return next;
    });
  };

  const clearAnswer = (questionId: string) => {
    updateAnswer(questionId, { selected_option_id: null, text_answer: null, code_answer: null });
  };

  // ------------------------------------------------------------------- views
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-steel" />
        <p className="text-sm text-muted-foreground">Resuming examination — restoring your session…</p>
      </div>
    );
  }

  if (!exam || !settings || items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-muted-foreground">This examination has no questions yet.</p>
      </div>
    );
  }

  const current = items[currentIdx];
  const urgent = secondsLeft < 300;

  const renderQuestion = (q: QuestionData, label: string) => {
    const answer = answers[q.id];
    const isCoding = q.question_type === "coding";
    return (
      <div key={q.id} className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-steel">{label}</span>
          <Badge variant="outline" className="text-[10px] uppercase">
            {q.question_type.replace(/_/g, " ")}
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {q.marks} mark{q.marks !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-card-gradient p-5 shadow-card">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{q.question_text}</p>
        </div>

        {q.question_type === "mcq" && (
          <div className="space-y-2">
            {[...(q.question_options_student || [])]
              .sort((a, b) => a.order_index - b.order_index)
              .map((opt) => {
                const selected = answer?.selected_option_id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnswer(q.id, { selected_option_id: opt.id })}
                    className={`w-full rounded-lg border p-4 text-left text-sm transition-all ${
                      selected
                        ? "border-steel bg-steel/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-steel/30 hover:text-foreground"
                    }`}
                  >
                    {opt.option_text}
                  </button>
                );
              })}
          </div>
        )}

        {q.question_type === "short_answer" && (
          <Input
            data-clipboard-allowed="true"
            value={answer?.text_answer || ""}
            onChange={(e) => updateAnswer(q.id, { text_answer: e.target.value })}
            placeholder="Type your answer…"
          />
        )}

        {(q.question_type === "long_answer" || q.question_type === "subjective") && (
          <Textarea
            data-clipboard-allowed="true"
            rows={10}
            value={answer?.text_answer || ""}
            onChange={(e) => updateAnswer(q.id, { text_answer: e.target.value })}
            placeholder="Write your detailed answer…"
          />
        )}

        {isCoding && (
          <div className="space-y-3" data-clipboard-allowed="true">
            {(q.input_format || q.output_format || q.constraints_text) && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                {q.input_format && (
                  <div><span className="font-medium text-foreground">Input:</span> <span className="text-muted-foreground">{q.input_format}</span></div>
                )}
                {q.output_format && (
                  <div><span className="font-medium text-foreground">Output:</span> <span className="text-muted-foreground">{q.output_format}</span></div>
                )}
                {q.constraints_text && (
                  <div><span className="font-medium text-foreground">Constraints:</span> <span className="text-muted-foreground">{q.constraints_text}</span></div>
                )}
              </div>
            )}
            <CodeEditor
              code={answer?.code_answer ?? q.code_template ?? ""}
              language={q.code_language || "python"}
              onCodeChange={(code) => updateAnswer(q.id, { code_answer: code })}
              testCases={Array.isArray(q.test_cases) ? q.test_cases : []}
              readOnlyLanguage
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => clearAnswer(q.id)}>
            <Eraser size={14} /> Clear answer
          </Button>
          <Button
            variant={marked.includes(q.id) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => toggleMark(q.id)}
          >
            <Flag size={14} /> {marked.includes(q.id) ? "Unmark" : "Mark for review"}
          </Button>
        </div>
      </div>
    );
  };

  const paletteBlock = (
    <QuestionPalette items={paletteItems} current={currentIdx} onSelect={goTo} />
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-widest text-steel">
              Instruvex Examination
            </p>
            <h1 className="truncate text-sm font-medium text-foreground">{exam.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-lg bg-steel/10 px-2 py-1 text-[11px] text-steel sm:flex">
              <Shield size={11} /> Secure mode
            </span>
            <div
              role="timer"
              aria-live="off"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold ${
                urgent ? "animate-pulse bg-destructive/20 text-destructive" : "bg-steel/10 text-steel"
              }`}
            >
              <Clock size={14} /> {formatClock(secondsLeft)}
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">Questions</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="mt-6">{paletteBlock}</div>
              </SheetContent>
            </Sheet>
            <Button variant="hero" size="sm" disabled={submitting} onClick={() => setConfirmOpen(true)}>
              <Send size={14} /> Submit
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-5 lg:block">
          {paletteBlock}
          <div className="mt-6 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1 text-foreground">{answeredCount} of {totalQuestions} answered</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-steel transition-all"
                style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>
        </aside>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          <p className="mb-4 text-xs text-muted-foreground">
            Question {currentIdx + 1} of {items.length}
          </p>

          {current?.type === "standalone" && current.question &&
            renderQuestion(current.question, `Question ${currentIdx + 1}`)}

          {current?.type === "case_study" && (
            <div>
              <Badge variant="outline" className="mb-3 flex w-fit items-center gap-1 text-[10px]">
                <BookOpen size={11} /> CASE STUDY
              </Badge>
              {current.scenario?.scenario_text && (
                <div className="mb-6 rounded-xl border border-border bg-card-gradient p-6 shadow-card">
                  <h3 className="mb-2 font-display text-sm font-semibold text-steel">Scenario</h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                    {current.scenario.scenario_text}
                  </p>
                </div>
              )}
              {current.subQuestions?.map((sq, si) => renderQuestion(sq, `Q${currentIdx + 1}.${si + 1}`))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0}>
              <ChevronLeft size={16} /> Previous
            </Button>
            {currentIdx === items.length - 1 ? (
              <Button variant="hero" onClick={() => setConfirmOpen(true)} disabled={submitting}>
                <Send size={16} /> Submit examination
              </Button>
            ) : (
              <Button variant="outline" onClick={() => goTo(currentIdx + 1)}>
                Save &amp; next <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </main>
      </div>

      {/* Status bar */}
      <footer className="sticky bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-2 text-[11px] backdrop-blur">
        <span className="flex items-center gap-1.5">
          {!security.online ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <WifiOff size={12} /> Connection lost — your answers are preserved and will sync automatically
            </span>
          ) : saveStatus === "saving" ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Saving…
            </span>
          ) : saveStatus === "error" ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <CloudOff size={12} /> Retrying save…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 size={12} /> Answers saved
            </span>
          )}
        </span>
        <span className="flex items-center gap-3 text-muted-foreground">
          {security.violations > 0 && (
            <span className="text-amber-400">
              {security.violations} security event{security.violations > 1 ? "s" : ""} recorded
            </span>
          )}
          {(settings.ai_proctoring || settings.camera_required) && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Proctoring active
            </span>
          )}
        </span>
      </footer>

      {(settings.ai_proctoring || settings.camera_required) && (
        <ProctoringMonitor
          enabled={!loading && !submitting}
          onEvent={(type, severity, metadata) => recordEvent(type, severity, metadata)}
        />
      )}

      {/* Fullscreen recovery overlay */}
      {settings.fullscreen_required && security.fullscreenWarning && !submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-6 backdrop-blur">
          <div className="max-w-md rounded-2xl border border-destructive/40 bg-card p-6 text-center shadow-card">
            <Maximize className="mx-auto mb-3 h-7 w-7 text-destructive" />
            <h2 className="font-display text-lg font-semibold text-foreground">Fullscreen exited</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please return to fullscreen mode to continue your examination. This event has been recorded.
            </p>
            <Button variant="hero" className="mt-5" onClick={() => void security.requestFullscreen()}>
              Return to exam
            </Button>
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit examination?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Answered: {answeredCount} / {totalQuestions}</p>
                <p className={totalQuestions - answeredCount > 0 ? "text-amber-400" : undefined}>
                  Unanswered: {totalQuestions - answeredCount}
                </p>
                <p>Marked for review: {marked.length}</p>
                <p className="pt-2 text-muted-foreground">
                  Once submitted, you will not be able to change your answers.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue exam</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleSubmit(false)}>Submit examination</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur">
          <Loader2 className="h-7 w-7 animate-spin text-steel" />
          <p className="text-sm text-muted-foreground">Finalising your submission…</p>
        </div>
      )}
    </div>
  );
};

export default ExamTake;