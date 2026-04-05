import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

interface ProctoringLog {
  id: string;
  student_id: string;
  tab_switch_count: number;
  fullscreen_exit_count: number;
  copy_attempts: number;
  warnings_shown: number;
  auto_submitted: boolean;
  profile?: { first_name: string; last_name: string; email: string };
}

interface PlagiarismRecord {
  id: string;
  student_id: string;
  question_id: string;
  matched_student_id: string;
  similarity_score: number;
  flagged: boolean;
  detection_method: string;
  profile?: { first_name: string; last_name: string; email: string };
  matched_profile?: { first_name: string; last_name: string; email: string };
}

function getSecurityStatus(log: ProctoringLog) {
  const score = log.tab_switch_count * 3 + log.fullscreen_exit_count * 2 + log.copy_attempts;
  if (score >= 8 || log.auto_submitted) return { label: "Highly Suspicious", color: "destructive" as const };
  if (score >= 3) return { label: "Suspicious", color: "secondary" as const };
  return { label: "Safe", color: "default" as const };
}

const ExamSecurityReport = () => {
  const { examId } = useParams<{ examId: string }>();
  const { toast } = useToast();
  const [examTitle, setExamTitle] = useState("");
  const [proctoringLogs, setProctoringLogs] = useState<ProctoringLog[]>([]);
  const [plagiarismRecords, setPlagiarismRecords] = useState<PlagiarismRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);

  const loadData = async () => {
    if (!examId) return;
    setLoading(true);

    const [{ data: exam }, { data: logs }, { data: plagiarism }] = await Promise.all([
      supabase.from("exams").select("title").eq("id", examId).single(),
      supabase.from("proctoring_logs" as any).select("*").eq("exam_id", examId),
      supabase.from("plagiarism_records" as any).select("*").eq("exam_id", examId),
    ]);

    setExamTitle(exam?.title || "");

    // Fetch profiles for all student IDs
    const studentIds = new Set<string>();
    (logs || []).forEach((l: any) => studentIds.add(l.student_id));
    (plagiarism || []).forEach((p: any) => {
      studentIds.add(p.student_id);
      if (p.matched_student_id) studentIds.add(p.matched_student_id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", [...studentIds]);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    setProctoringLogs(
      (logs || []).map((l: any) => ({
        ...l,
        profile: profileMap.get(l.student_id),
      }))
    );

    setPlagiarismRecords(
      (plagiarism || []).map((p: any) => ({
        ...p,
        profile: profileMap.get(p.student_id),
        matched_profile: profileMap.get(p.matched_student_id),
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [examId]);

  const runPlagiarismCheck = async () => {
    setRunningCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-plagiarism", {
        body: { exam_id: examId },
      });
      if (error) throw error;
      toast({ title: "Plagiarism check complete", description: `${data?.records || 0} comparison records generated.` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setRunningCheck(false);
  };

  const getName = (profile?: { first_name: string; last_name: string; email: string }) =>
    profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email : "Unknown";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/dashboard/exams/${examId}`}>
              <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-steel" /> Security Report
              </h1>
              <p className="text-sm text-muted-foreground">{examTitle}</p>
            </div>
          </div>
          <Button onClick={runPlagiarismCheck} disabled={runningCheck} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${runningCheck ? "animate-spin" : ""}`} />
            {runningCheck ? "Checking…" : "Run Plagiarism Check"}
          </Button>
        </div>

        <Tabs defaultValue="proctoring">
          <TabsList>
            <TabsTrigger value="proctoring">
              <Eye className="h-4 w-4 mr-1" /> Proctoring ({proctoringLogs.length})
            </TabsTrigger>
            <TabsTrigger value="plagiarism">
              <AlertTriangle className="h-4 w-4 mr-1" /> Plagiarism ({plagiarismRecords.filter(r => r.flagged).length} flagged)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proctoring" className="mt-4">
            {proctoringLogs.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                No proctoring data available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {proctoringLogs.map((log) => {
                  const status = getSecurityStatus(log);
                  return (
                    <div key={log.id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-foreground">{getName(log.profile)}</p>
                          <p className="text-xs text-muted-foreground">{log.profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{log.tab_switch_count}</p>
                          <p className="text-xs text-muted-foreground">Tab Switches</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{log.fullscreen_exit_count}</p>
                          <p className="text-xs text-muted-foreground">FS Exits</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{log.copy_attempts}</p>
                          <p className="text-xs text-muted-foreground">Copy Attempts</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={status.color}>{status.label}</Badge>
                          {log.auto_submitted && (
                            <span className="text-xs text-destructive font-medium">Auto-submitted</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="plagiarism" className="mt-4">
            {plagiarismRecords.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                No plagiarism data. Click "Run Plagiarism Check" to analyze submissions.
              </div>
            ) : (
              <div className="space-y-3">
                {plagiarismRecords
                  .filter(r => r.flagged)
                  .sort((a, b) => b.similarity_score - a.similarity_score)
                  .map((record) => (
                    <div key={record.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-foreground">{getName(record.profile)}</span>
                          <span className="text-muted-foreground">↔</span>
                          <span className="font-medium text-foreground">{getName(record.matched_profile)}</span>
                        </div>
                        <Badge variant={record.similarity_score >= 85 ? "destructive" : "secondary"}>
                          {record.similarity_score}% match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={record.similarity_score} className="flex-1" />
                        <Badge variant="outline" className="text-xs">{record.detection_method.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                {plagiarismRecords.filter(r => !r.flagged).length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      Show {plagiarismRecords.filter(r => !r.flagged).length} low-similarity matches
                    </summary>
                    <div className="space-y-2 mt-2">
                      {plagiarismRecords
                        .filter(r => !r.flagged)
                        .sort((a, b) => b.similarity_score - a.similarity_score)
                        .map((record) => (
                          <div key={record.id} className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between text-sm">
                            <span>{getName(record.profile)} ↔ {getName(record.matched_profile)}</span>
                            <span className="text-muted-foreground">{record.similarity_score}%</span>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ExamSecurityReport;
