import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Clock, FileText, Award, Repeat, MinusCircle, AlertTriangle, Play, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SecurityCheck from "@/components/exam/SecurityCheck";
import ExamRulesConsent from "@/components/exam/ExamRulesConsent";
import { ExamSecuritySettings, logSecurityEvent, parseSecuritySettings } from "@/lib/exam-security";

type Stage = "details" | "check" | "rules" | "starting";

interface ExamInfo {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  status: string;
  end_time: string | null;
  attempt_limit: number;
  negative_marking: number;
  security_settings: unknown;
}

const ExamStart = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [settings, setSettings] = useState<ExamSecuritySettings | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("details");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId || !user) return;
    const load = async () => {
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .maybeSingle();

      if (!examData) {
        setError("This examination could not be found.");
        setLoading(false);
        return;
      }

      const info = examData as unknown as ExamInfo;
      if (!["published", "active"].includes(info.status)) {
        setError("This examination is not currently available.");
        setLoading(false);
        return;
      }
      if (info.end_time && new Date(info.end_time).getTime() < Date.now()) {
        setError("This examination window has closed.");
        setLoading(false);
        return;
      }
      if ((examData as any).start_time && new Date((examData as any).start_time).getTime() > Date.now()) {
        setError(`This examination starts on ${new Date((examData as any).start_time).toLocaleString()}.`);
        setLoading(false);
        return;
      }

      setExam(info);
      setSettings(parseSecuritySettings((examData as any).security_settings));

      const [{ count }, { data: subs }] = await Promise.all([
        supabase.from("questions").select("*", { count: "exact", head: true }).eq("exam_id", examId).is("parent_question_id", null),
        supabase.from("exam_submissions").select("id, status").eq("exam_id", examId).eq("student_id", user.id),
      ]);

      setQuestionCount(count || 0);
      setAttemptsUsed((subs || []).length);
      setHasActive((subs || []).some((s) => s.status === "in_progress"));
      setLoading(false);
    };
    void load();
  }, [examId, user]);

  const beginAttempt = async () => {
    if (!examId || !user || !settings) return;
    setStage("starting");

    // Enter fullscreen while still inside the user gesture chain.
    if (settings.fullscreen_required) {
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* the portal will prompt again */
      }
    }

    const { data, error: rpcError } = await supabase.rpc("start_exam_attempt" as any, { _exam_id: examId });

    if (rpcError || !data) {
      setStage("details");
      toast({
        title: "Unable to start examination",
        description: rpcError?.message || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    const submission = Array.isArray(data) ? data[0] : data;
    void logSecurityEvent({
      examId,
      studentId: user.id,
      submissionId: submission?.id ?? null,
      type: hasActive ? "EXAM_RESUMED" : "EXAM_STARTED",
      severity: "info",
    });

    navigate(`/exam/${examId}/take`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-steel" />
      </div>
    );
  }

  if (error || !exam || !settings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{error || "Examination unavailable."}</p>
        <Button variant="outline" asChild><Link to="/dashboard/exams">Back to examinations</Link></Button>
      </div>
    );
  }

  const attemptLimit = Math.max(exam.attempt_limit || 1, 1);
  const limitReached = !hasActive && attemptsUsed >= attemptLimit;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/dashboard/exams")}>
          <ArrowLeft size={16} /> Back to examinations
        </Button>

        {stage === "details" && (
          <>
            <div className="mb-6 rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
              <Badge className="mb-3 capitalize">{exam.status}</Badge>
              <h1 className="font-display text-2xl font-bold text-foreground">{exam.title}</h1>
              {exam.description && <p className="mt-2 text-sm text-muted-foreground">{exam.description}</p>}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat icon={FileText} label="Questions" value={String(questionCount)} />
                <Stat icon={Award} label="Maximum marks" value={String(exam.total_marks)} />
                <Stat icon={Clock} label="Duration" value={`${exam.duration_minutes} min`} />
                <Stat icon={Repeat} label="Attempts" value={`${Math.min(attemptsUsed + (hasActive ? 0 : 1), attemptLimit)} / ${attemptLimit}`} />
                <Stat
                  icon={MinusCircle}
                  label="Negative marking"
                  value={exam.negative_marking > 0 ? `-${exam.negative_marking} per wrong answer` : "None"}
                />
                {exam.end_time && (
                  <Stat icon={Clock} label="Available until" value={new Date(exam.end_time).toLocaleString()} />
                )}
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-steel">
                Important instructions
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {settings.fullscreen_required && <li>• The examination must be completed in fullscreen mode.</li>}
                {settings.tab_switch_detection && <li>• Switching tabs or windows is recorded as a security event.</li>}
                {settings.copy_paste_protection && <li>• Copy and paste are disabled outside the code editor.</li>}
                <li>• Your answers are saved automatically as you work.</li>
                <li>• Refreshing is safe — your attempt and timer are restored from the server.</li>
                <li>• The examination submits automatically when the timer reaches zero.</li>
                {(settings.ai_proctoring || settings.camera_required) && (
                  <li>• AI proctoring is enabled for this examination and requires camera access.</li>
                )}
                {settings.auto_submit_on_violation && (
                  <li>• The attempt is submitted automatically after {settings.max_violations} security violations.</li>
                )}
              </ul>
            </div>

            {limitReached ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
                <h3 className="font-display text-lg font-semibold text-foreground">Attempt limit reached</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You have already used your permitted attempt{attemptLimit > 1 ? "s" : ""}.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/dashboard/exams">Back to examinations</Link>
                </Button>
              </div>
            ) : (
              <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => setConfirmOpen(true)}>
                <Play size={16} /> {hasActive ? "Continue examination" : "Start examination"}
              </Button>
            )}

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you ready to begin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Once the examination starts, the timer will begin and cannot be paused.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setStage("check")}>Start examination</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {stage === "check" && (
          <SecurityCheck
            settings={settings}
            onCancel={() => setStage("details")}
            onReady={(stream) => {
              // The portal opens its own proctoring stream; release this probe.
              stream?.getTracks().forEach((t) => t.stop());
              setStage("rules");
            }}
          />
        )}

        {stage === "rules" && (
          <ExamRulesConsent
            settings={settings}
            onCancel={() => setStage("details")}
            onAccept={() => void beginAttempt()}
          />
        )}

        {stage === "starting" && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-steel" />
            <p className="text-sm text-muted-foreground">Preparing your secure examination…</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl border border-border/70 bg-background/40 p-4">
    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
      <Icon size={13} /> {label}
    </div>
    <p className="font-display text-base font-semibold text-foreground">{value}</p>
  </div>
);

export default ExamStart;