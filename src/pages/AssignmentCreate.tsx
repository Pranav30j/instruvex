import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, Loader2, Upload } from "lucide-react";
import { notifyStudentsOfAssignment } from "@/lib/notifications";

const AssignmentCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["my-courses-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_courses")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      let attachmentUrl: string | null = null;

      if (attachmentFile) {
        setUploading(true);
        const filePath = `${user!.id}/${Date.now()}-${attachmentFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, attachmentFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("assignment-files")
          .getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
        setUploading(false);
      }

      const { data: insertedData, error } = await supabase.from("assignments").insert({
        title,
        description: description || null,
        course_id: courseId || null,
        created_by: user!.id,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        max_marks: maxMarks ? Number(maxMarks) : null,
        attachment_url: attachmentUrl,
        status: publish ? "published" : "draft",
      }).select("id, title").single();
      if (error) throw error;
      return { publish, assignment: insertedData };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: result.publish ? "Assignment published!" : "Draft saved!" });
      if (result.publish && result.assignment) {
        notifyStudentsOfAssignment(result.assignment.id, result.assignment.title);
      }
      navigate("/dashboard/assignments");
    },
    onError: (err: Error) => {
      setUploading(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/assignments")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Create Assignment</h1>
        </div>

        <div className="grid gap-6 rounded-xl border border-border bg-card p-6 shadow-card lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Assignment title…" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the assignment requirements…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Attachment (optional)</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-steel/40 hover:text-foreground">
                  <Upload size={16} />
                  {attachmentFile ? attachmentFile.name : "Upload file…"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course (optional)</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Marks</Label>
              <Input type="number" placeholder="100" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
            </div>

            <div className="space-y-2 pt-4">
              <Button
                className="w-full gap-2"
                onClick={() => saveMutation.mutate(true)}
                disabled={!title || saveMutation.isPending || uploading}
              >
                {saveMutation.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => saveMutation.mutate(false)}
                disabled={!title || saveMutation.isPending || uploading}
              >
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssignmentCreate;
