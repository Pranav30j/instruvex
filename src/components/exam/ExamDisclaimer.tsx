import { Shield, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamDisclaimerProps {
  examTitle: string;
  onAccept: () => void;
}

const ExamDisclaimer = ({ examTitle, onAccept }: ExamDisclaimerProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-steel/10">
            <Shield className="h-6 w-6 text-steel" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Exam Security Notice</h1>
            <p className="text-sm text-muted-foreground">{examTitle}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Eye className="h-5 w-5 text-steel mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">This exam is monitored</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tab switches, fullscreen exits, and copy/paste attempts are tracked and reported to your instructor.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Rules</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc pl-4">
                <li>The exam will run in fullscreen mode</li>
                <li>Switching tabs more than 3 times will auto-submit your exam</li>
                <li>Copy and paste are disabled</li>
                <li>Right-click is disabled</li>
                <li>Answers are checked for plagiarism after submission</li>
              </ul>
            </div>
          </div>
        </div>

        <Button onClick={onAccept} className="w-full" variant="hero" size="lg">
          <Shield className="h-4 w-4 mr-2" />
          I Understand — Start Exam
        </Button>
      </div>
    </div>
  );
};

export default ExamDisclaimer;
