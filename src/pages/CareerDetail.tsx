import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Briefcase, MapPin, IndianRupee, Clock, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const applySchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  portfolio_link: z.string().trim().url("Invalid URL").max(500).optional().or(z.literal("")),
  cover_letter: z.string().trim().max(3000).optional().or(z.literal("")),
});

const CareerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", portfolio_link: "", cover_letter: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_posts").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingApp } = useQuery({
    queryKey: ["my-application", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("applications").select("id,status").eq("job_id", id!).eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const openApply = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setForm({
      full_name: profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : "",
      email: profile?.email || user.email || "",
      phone: "",
      portfolio_link: "",
      cover_letter: "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = applySchema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    if (!user || !job) return;
    if (resume && resume.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Resume must be under 5MB.", variant: "destructive" });
      return;
    }
    if (resume && resume.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Resume must be a PDF.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let resume_url: string | null = null;
      if (resume) {
        const path = `${user.id}/${Date.now()}-${resume.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("resumes").upload(path, resume, { upsert: false });
        if (upErr) throw upErr;
        resume_url = path;
      }

      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        user_id: user.id,
        full_name: result.data.full_name,
        email: result.data.email,
        phone: result.data.phone,
        resume_url,
        portfolio_link: result.data.portfolio_link || null,
        cover_letter: result.data.cover_letter || null,
      });
      if (error) throw error;

      await supabase.rpc("create_notification", {
        _user_id: user.id,
        _title: "Application Submitted",
        _message: `Your application for "${job.title}" has been submitted.`,
        _type: "success",
        _link: "/dashboard/careers/my-applications",
      });

      toast({ title: "Application submitted!", description: "We'll review your application soon." });
      setOpen(false);
      setResume(null);
      navigate("/dashboard/careers/my-applications");
    } catch (err: any) {
      const msg = err?.message?.includes("duplicate") ? "You've already applied to this position." : "Failed to submit application.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
            <Link to="/careers"><ArrowLeft size={16} /> Back to Careers</Link>
          </Button>

          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel border-t-transparent" />
          ) : !job ? (
            <div className="rounded-xl border border-border bg-card-gradient p-12 text-center">
              <h2 className="font-display text-xl font-semibold">Position not found</h2>
              <p className="mt-2 text-muted-foreground">This role may have been closed or removed.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card-gradient p-8 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold text-foreground">{job.title}</h1>
                  <p className="mt-1 text-muted-foreground">{job.company_name}</p>
                </div>
                <Badge variant="secondary" className="capitalize">{job.type}</Badge>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 capitalize"><MapPin size={16} /> {job.work_mode}{job.location ? ` · ${job.location}` : ""}</span>
                {job.salary && <span className="flex items-center gap-1.5"><IndianRupee size={16} /> {job.salary}</span>}
                {job.duration && <span className="flex items-center gap-1.5"><Clock size={16} /> {job.duration}</span>}
                <span className="flex items-center gap-1.5"><Briefcase size={16} /> {job.status}</span>
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="mb-2 font-display text-lg font-semibold">About the Role</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.description}</p>
                </div>
                {job.requirements && (
                  <div>
                    <h3 className="mb-2 font-display text-lg font-semibold">Requirements</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.requirements}</p>
                  </div>
                )}
                {job.skills_required && job.skills_required.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-display text-lg font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((s: string) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-border pt-6">
                {existingApp ? (
                  <div className="rounded-lg bg-steel/10 p-4 text-sm">
                    You've already applied. Status: <span className="font-medium capitalize text-steel">{existingApp.status}</span>
                  </div>
                ) : (
                  <Button variant="hero" size="lg" onClick={openApply} className="gap-2">
                    <Send size={16} /> Apply Now
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Apply for {job?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume">Resume (PDF, max 5MB)</Label>
              <Input id="resume" type="file" accept="application/pdf" onChange={(e) => setResume(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio_link">Portfolio / LinkedIn URL</Label>
              <Input id="portfolio_link" value={form.portfolio_link} onChange={(e) => setForm({ ...form, portfolio_link: e.target.value })} placeholder="https://..." />
              {errors.portfolio_link && <p className="text-xs text-destructive">{errors.portfolio_link}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_letter">Cover Letter</Label>
              <Textarea id="cover_letter" rows={4} value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} />
            </div>
            <Button type="submit" variant="hero" className="w-full gap-2" disabled={loading}>
              <Send size={16} /> {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CareerDetail;