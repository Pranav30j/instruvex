import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Upload, Link as LinkIcon, Loader2, FileText, Eye, Download } from "lucide-react";
import { format, isPast } from "date-fns";

const AssignmentDetail = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isCreator = activeRole && ["super_admin", "institute_admin", "instructor"].includes(activeRole);

  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState("");
  const [textResponse, setTextResponse] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewSub, setViewSub] = useState<any>(null);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, academy_courses(title)")
        .eq("id", assignmentId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId,
  });

  const { data: mySubmission } = useQuery({
    queryKey: ["my-submission", assignmentId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", assignmentId!)
        .eq("student_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId && !!user && activeRole === "student",
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["assignment-submissions", assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*, profiles:student_id(first_name, last_name, email)")
        .eq("assignment_id", assignmentId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId && !!isCreator,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const uploadedFiles: string[] = [];

      for (const file of files) {
        const filePath = `${assignmentId}/${user!.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("assignment-files")
          .getPublicUrl(filePath);
        uploadedFiles.push(urlData.publicUrl);
      }

      const linkArray = links.split("\n").map((l) => l.trim()).filter(Boolean);
      const isLate = assignment?.due_date && isPast(new Date(assignment.due_date));

      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId!,
        student_id: user!.id,
        files: uploadedFiles,
        links: linkArray,
        text_response: textResponse || null,
        status: isLate ? "late" : "submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setUploading(false);
      queryClient.invalidateQueries({ queryKey: ["my-submission", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      toast({ title: "Assignment submitted!" });
    },
    onError: (err: Error) => {
      setUploading(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted-foreground">Assignment not found.</div>
      </DashboardLayout>
    );
  }

  const isOverdue = assignment.due_date && isPast(new Date(assignment.due_date));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/assignments")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{assignment.title}</h1>
            {(assignment as any).academy_courses?.title && (
              <p className="text-sm text-muted-foreground">{(assignment as any).academy_courses.title}</p>
            )}
          </div>
          {assignment.due_date && (
            <Badge variant="outline" className={isOverdue ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-steel/20 bg-steel/10 text-steel"}>
              <Calendar size={12} className="mr-1" />
              Due {format(new Date(assignment.due_date), "MMM d, yyyy 'at' h:mm a")}
            </Badge>
          )}
        </div>

        {/* Assignment details */}
        <Card className="border-border bg-card shadow-card">
          <CardContent className="pt-6 space-y-4">
            {assignment.description && (
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">{assignment.description}</div>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {assignment.max_marks && <span>Max Marks: <strong className="text-foreground">{assignment.max_marks}</strong></span>}
              <span>Status: <strong className="text-foreground capitalize">{assignment.status}</strong></span>
            </div>
            {assignment.attachment_url && (
              <a href={assignment.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-steel hover:underline">
                <Download size={14} /> Download Attachment
              </a>
            )}
          </CardContent>
        </Card>

        {/* Student submission */}
        {activeRole === "student" && (
          mySubmission ? (
            <Card className="border-green-500/20 bg-green-500/5 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <FileText size={18} /> Submission Received
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Submitted: {format(new Date(mySubmission.submitted_at), "MMM d, yyyy 'at' h:mm a")}</p>
                <p>Status: <Badge variant="outline" className="ml-1 capitalize">{mySubmission.status}</Badge></p>
                {mySubmission.marks_awarded != null && <p>Marks: <strong className="text-foreground">{mySubmission.marks_awarded}</strong></p>}
                {mySubmission.feedback && <p>Feedback: {mySubmission.feedback}</p>}
                {mySubmission.files?.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">Files:</p>
                    {mySubmission.files.map((f: string, i: number) => (
                      <a key={i} href={f} target="_blank" rel="noreferrer" className="block text-steel hover:underline">{f.split("/").pop()}</a>
                    ))}
                  </div>
                )}
                {mySubmission.links?.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">Links:</p>
                    {mySubmission.links.map((l: string, i: number) => (
                      <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-steel hover:underline">{l}</a>
                    ))}
                  </div>
                )}
                {mySubmission.text_response && (
                  <div>
                    <p className="font-medium text-foreground">Response:</p>
                    <p className="whitespace-pre-wrap">{mySubmission.text_response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Submit Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Files (PDF, images, docs)</Label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-steel/40">
                    <Upload size={16} />
                    {files.length > 0 ? `${files.length} file(s) selected` : "Choose files…"}
                    <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><LinkIcon size={14} /> Links (one per line)</Label>
                  <Textarea
                    placeholder="https://drive.google.com/..."
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Text Response (optional)</Label>
                  <Textarea
                    placeholder="Write your answer…"
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => submitMutation.mutate()}
                  disabled={(!files.length && !links.trim() && !textResponse.trim()) || submitMutation.isPending || uploading}
                >
                  {submitMutation.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
                  Submit Assignment
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {/* Teacher submissions view */}
        {isCreator && (
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Submissions ({submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.profiles?.first_name} {sub.profiles?.last_name}
                          <span className="block text-xs text-muted-foreground">{sub.profiles?.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{sub.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(sub.submitted_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewSub(sub)}>
                            <Eye size={14} /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* View submission dialog */}
        <Dialog open={!!viewSub} onOpenChange={() => setViewSub(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            {viewSub && (
              <div className="space-y-4 text-sm">
                <p><strong>Student:</strong> {viewSub.profiles?.first_name} {viewSub.profiles?.last_name}</p>
                <p><strong>Submitted:</strong> {format(new Date(viewSub.submitted_at), "MMM d, yyyy 'at' h:mm a")}</p>
                <p><strong>Status:</strong> <Badge variant="outline" className="capitalize">{viewSub.status}</Badge></p>

                {viewSub.files?.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-foreground">Files:</p>
                    {viewSub.files.map((f: string, i: number) => (
                      <a key={i} href={f} target="_blank" rel="noreferrer" className="block text-steel hover:underline">
                        {f.split("/").pop()}
                      </a>
                    ))}
                  </div>
                )}
                {viewSub.links?.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-foreground">Links:</p>
                    {viewSub.links.map((l: string, i: number) => (
                      <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-steel hover:underline">{l}</a>
                    ))}
                  </div>
                )}
                {viewSub.text_response && (
                  <div>
                    <p className="mb-1 font-medium text-foreground">Text Response:</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{viewSub.text_response}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

// Need Send icon import
import { Send } from "lucide-react";

export default AssignmentDetail;
