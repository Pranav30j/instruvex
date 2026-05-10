import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Inbox, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const jobSchema = z.object({
  title: z.string().trim().min(2).max(150),
  type: z.enum(["job", "internship"]),
  work_mode: z.enum(["remote", "onsite", "hybrid"]),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  salary: z.string().trim().max(100).optional().or(z.literal("")),
  duration: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().min(10).max(10000),
  requirements: z.string().trim().max(5000).optional().or(z.literal("")),
  skills: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["active", "closed"]),
});

type JobForm = z.infer<typeof jobSchema>;

const empty: JobForm = {
  title: "", type: "internship", work_mode: "remote", location: "", salary: "", duration: "",
  description: "", requirements: "", skills: "", status: "active",
};

const CareersManage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<JobForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["job-posts-manage", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("*, applications(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (job: any) => {
    setEditing(job);
    setForm({
      title: job.title,
      type: job.type,
      work_mode: job.work_mode,
      location: job.location || "",
      salary: job.salary || "",
      duration: job.duration || "",
      description: job.description || "",
      requirements: job.requirements || "",
      skills: (job.skills_required || []).join(", "),
      status: job.status,
    });
    setErrors({});
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = jobSchema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        title: result.data.title,
        type: result.data.type,
        work_mode: result.data.work_mode,
        location: result.data.location || null,
        salary: result.data.salary || null,
        duration: result.data.duration || null,
        description: result.data.description,
        requirements: result.data.requirements || null,
        skills_required: result.data.skills ? result.data.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        status: result.data.status,
      };
      if (editing) {
        const { error } = await supabase.from("job_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Updated", description: "Job post updated." });
      } else {
        const { error } = await supabase.from("job_posts").insert({ ...payload, posted_by: user.id });
        if (error) throw error;
        toast({ title: "Created", description: "Job post created." });
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["job-posts-manage"] });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Save failed.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job post and all its applications?")) return;
    const { error } = await supabase.from("job_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    qc.invalidateQueries({ queryKey: ["job-posts-manage"] });
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Manage Careers</h1>
          <p className="text-sm text-muted-foreground">Create and manage job & internship postings</p>
        </div>
        <Button variant="hero" onClick={openNew} className="gap-2"><Plus size={16} /> New Post</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">No job posts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first job or internship posting.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job: any) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-display text-lg">{job.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">{job.type} · {job.work_mode}{job.location ? ` · ${job.location}` : ""}</p>
                  </div>
                  <Badge variant={job.status === "active" ? "default" : "secondary"} className="capitalize">{job.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {job.applications?.[0]?.count ?? 0} applicant(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(job)} className="gap-1.5"><Pencil size={14} /> Edit</Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link to={`/dashboard/careers/applications?job=${job.id}`}><Inbox size={14} /> Applicants</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(job.id)} className="gap-1.5 text-destructive hover:text-destructive"><Trash2 size={14} /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit" : "New"} Job Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Work Mode</Label>
                <Select value={form.work_mode} onValueChange={(v) => setForm({ ...form, work_mode: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" />
              </div>
              <div className="space-y-2">
                <Label>Salary / Stipend</Label>
                <Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="₹15,000/mo" />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3 months" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Skills (comma separated)</Label>
              <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, TypeScript, Node.js" />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Post" : "Create Post"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CareersManage;