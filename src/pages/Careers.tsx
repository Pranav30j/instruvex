import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const applicationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  linkedin_url: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const Careers = () => {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", linkedin_url: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: jobs = [] } = useQuery({
    queryKey: ["job-listings"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("job_listings" as any) as any).select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setErrors({});

    const result = applicationSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("job_applications" as any).insert({
        job_id: selectedJob,
        name: result.data.name,
        email: result.data.email,
        linkedin_url: result.data.linkedin_url || null,
        message: result.data.message || null,
      });
      if (error) throw error;
      toast({ title: "Application submitted!", description: "We'll review your application and get back to you." });
      setSelectedJob(null);
      setForm({ name: "", email: "", linkedin_url: "", message: "" });
    } catch {
      toast({ title: "Error", description: "Failed to submit application.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold text-foreground md:text-6xl"
          >
            Join <span className="text-gradient">Instruvex</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground"
          >
            Help us build the future of AI-powered education
          </motion.p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 font-display text-2xl font-bold text-foreground">Open Positions</h2>

          {jobs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card-gradient p-12 text-center shadow-card">
              <Briefcase size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">No openings currently</h3>
              <p className="text-muted-foreground">Stay tuned! We're always growing and new positions open frequently.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card-gradient p-6 shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {job.type}</span>
                    </div>
                  </div>
                  <Button variant="hero" size="sm" onClick={() => setSelectedJob(job.id)}>
                    Apply Now
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Apply Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Apply for Position</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apply-name">Name *</Label>
              <Input id="apply-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-email">Email *</Label>
              <Input id="apply-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-linkedin">LinkedIn / Portfolio URL</Label>
              <Input id="apply-linkedin" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-message">Cover Note</Label>
              <Textarea id="apply-message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
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

export default Careers;
