import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExamSecuritySettings } from "@/lib/exam-security";

interface Props {
  settings: ExamSecuritySettings;
  onAccept: () => void;
  onCancel: () => void;
}

/**
 * Consent screen. Only lists monitoring the browser can genuinely perform for
 * this examination's configuration.
 */
const ExamRulesConsent = ({ settings, onAccept, onCancel }: Props) => {
  const detectable: string[] = [];
  if (settings.tab_switch_detection) detectable.push("Tab or window switching");
  if (settings.fullscreen_required) detectable.push("Exiting fullscreen mode");
  if (settings.copy_paste_protection) detectable.push("Copy, cut and paste attempts");
  if (settings.right_click_protection) detectable.push("Context menu (right-click) usage");
  detectable.push("Loss of network connectivity");
  if (settings.ai_proctoring || settings.camera_required) {
    detectable.push("Camera interruptions");
    detectable.push("Face not visible or more than one person in frame");
  }
  if (settings.microphone_required) detectable.push("Microphone interruptions");

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Shield size={18} className="text-steel" />
        <h2 className="font-display text-lg font-semibold text-foreground">Secure examination</h2>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">During this examination:</p>
      <ul className="mb-5 space-y-2 text-sm text-foreground">
        <li>✓ Stay inside the examination window.</li>
        {settings.fullscreen_required && <li>✓ Keep the examination in fullscreen mode.</li>}
        <li>✓ Your answers are saved automatically.</li>
        <li>✓ Security events may be recorded and reviewed by faculty.</li>
      </ul>

      <p className="mb-2 text-sm text-muted-foreground">The following may be detected and recorded:</p>
      <ul className="mb-5 space-y-1.5 text-sm text-muted-foreground">
        {detectable.map((d) => (
          <li key={d} className="flex gap-2">
            <span className="text-steel">•</span>
            {d}
          </li>
        ))}
      </ul>

      <p className="mb-6 rounded-lg border border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">
        These are detection mechanisms, not guarantees. A recorded event is treated as a
        potential integrity violation for faculty review — it is not an automatic accusation.
      </p>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="hero" onClick={onAccept}>I understand &amp; continue</Button>
      </div>
    </div>
  );
};

export default ExamRulesConsent;