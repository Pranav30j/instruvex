import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Briefcase, MapPin, IndianRupee, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Careers = () => {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");

  const { data: jobs = [] } = useQuery({
    queryKey: ["job-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = jobs.filter((j: any) => {
    if (typeFilter !== "all" && j.type !== typeFilter) return false;
    if (modeFilter !== "all" && j.work_mode !== modeFilter) return false;
    return true;
  });

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
            Explore open roles and internships shaping the future of AI-powered education
          </motion.p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl font-bold text-foreground">Open Positions</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="job">Jobs</SelectItem>
                  <SelectItem value="internship">Internships</SelectItem>
                </SelectContent>
              </Select>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card-gradient p-12 text-center shadow-card">
              <Briefcase size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">No openings match your filters</h3>
              <p className="text-muted-foreground">Check back soon — new roles open frequently.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((job: any, i: number) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card-gradient p-6 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company_name}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{job.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 capitalize"><MapPin size={14} /> {job.work_mode}{job.location ? ` · ${job.location}` : ""}</span>
                    {job.salary && <span className="flex items-center gap-1"><IndianRupee size={14} /> {job.salary}</span>}
                    {job.duration && <span className="flex items-center gap-1"><Clock size={14} /> {job.duration}</span>}
                  </div>
                  <div className="flex justify-end">
                    <Button asChild variant="hero" size="sm">
                      <Link to={`/careers/${job.id}`}>View Details</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
