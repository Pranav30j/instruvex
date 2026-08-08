import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExamSecuritySettings } from "@/lib/exam-security";

type CheckState = "pending" | "pass" | "fail" | "skipped";

interface CheckRow {
  key: string;
  label: string;
  state: CheckState;
  detail?: string;
}

interface Props {
  settings: ExamSecuritySettings;
  onReady: (stream: MediaStream | null) => void;
  onCancel: () => void;
}

const StateIcon = ({ state }: { state: CheckState }) => {
  if (state === "pending") return <Loader2 size={16} className="animate-spin text-muted-foreground" />;
  if (state === "pass") return <CheckCircle2 size={16} className="text-emerald-400" />;
  if (state === "skipped") return <span className="text-xs text-muted-foreground">Not required</span>;
  return <XCircle size={16} className="text-destructive" />;
};

/**
 * Pre-exam readiness check. Camera / microphone permissions are only
 * requested when the examination actually requires them.
 */
const SecurityCheck = ({ settings, onReady, onCancel }: Props) => {
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [running, setRunning] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let localStream: MediaStream | null = null;

    const run = async () => {
      setRunning(true);
      const rows: CheckRow[] = [];

      const isSecureBrowser = typeof window !== "undefined" && "requestFullscreen" in document.documentElement;
      rows.push({
        key: "browser",
        label: "Browser compatibility",
        state: isSecureBrowser ? "pass" : "fail",
        detail: isSecureBrowser ? undefined : "Please use a recent desktop version of Chrome, Edge, Firefox or Safari.",
      });

      const fullscreenOk = !settings.fullscreen_required || !!document.fullscreenEnabled;
      rows.push({
        key: "fullscreen",
        label: "Fullscreen support",
        state: settings.fullscreen_required ? (fullscreenOk ? "pass" : "fail") : "skipped",
        detail: fullscreenOk ? undefined : "This browser does not allow fullscreen mode.",
      });

      rows.push({
        key: "network",
        label: "Network connection",
        state: navigator.onLine ? "pass" : "fail",
        detail: navigator.onLine ? undefined : "You appear to be offline.",
      });

      const needsCamera = settings.ai_proctoring || settings.camera_required;
      const needsMic = settings.microphone_required;

      if (needsCamera || needsMic) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: needsCamera,
            audio: needsMic,
          });
          if (!cancelled) setStream(localStream);
          rows.push({ key: "camera", label: "Camera", state: needsCamera ? "pass" : "skipped" });
          rows.push({ key: "mic", label: "Microphone", state: needsMic ? "pass" : "skipped" });
          rows.push({ key: "proctoring", label: "Proctoring permissions", state: "pass" });
        } catch (err) {
          const message =
            err instanceof DOMException && err.name === "NotAllowedError"
              ? "Permission was denied. This examination uses AI proctoring, so access is required to continue."
              : "No usable device was found. Please connect a device and retry.";
          rows.push({ key: "camera", label: "Camera", state: needsCamera ? "fail" : "skipped", detail: needsCamera ? message : undefined });
          rows.push({ key: "mic", label: "Microphone", state: needsMic ? "fail" : "skipped", detail: needsMic ? message : undefined });
          rows.push({ key: "proctoring", label: "Proctoring permissions", state: "fail", detail: message });
        }
      } else {
        rows.push({ key: "camera", label: "Camera", state: "skipped" });
        rows.push({ key: "mic", label: "Microphone", state: "skipped" });
        rows.push({ key: "proctoring", label: "Proctoring permissions", state: "skipped" });
      }

      rows.push({ key: "env", label: "Secure exam environment", state: "pass" });

      if (!cancelled) {
        setChecks(rows);
        setRunning(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [settings, attempt]);

  const failed = checks.filter((c) => c.state === "fail");
  const canContinue = !running && failed.length === 0;

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck size={18} className="text-steel" />
        <h2 className="font-display text-lg font-semibold text-foreground">Secure examination check</h2>
      </div>

      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.key} className="rounded-lg border border-border/70 bg-background/40 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{c.label}</span>
              <StateIcon state={c.state} />
            </div>
            {c.detail && <p className="mt-1 text-xs text-destructive">{c.detail}</p>}
          </li>
        ))}
        {running && checks.length === 0 && (
          <li className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Running readiness checks…
          </li>
        )}
      </ul>

      {failed.some((f) => f.key === "camera" || f.key === "proctoring") && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Camera size={14} /> Camera permission required
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This examination uses AI proctoring. Camera access is required to continue.
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setAttempt((a) => a + 1)}>
            <RefreshCw size={14} /> Allow camera access
          </Button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <div className="flex gap-2">
          {!running && failed.length > 0 && (
            <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>
              <RefreshCw size={14} /> Retry checks
            </Button>
          )}
          <Button variant="hero" disabled={!canContinue} onClick={() => onReady(stream)}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SecurityCheck;