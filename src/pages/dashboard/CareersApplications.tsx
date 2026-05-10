import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, FileDown, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["pending", "shortlisted", "rejected", "selected"] as const;

const CareersApplications = () => {
  const [params, setParams] = useSearchParams();
  const jobFilter = params.get("job") || "all";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: jobs = [] } = useQuery({
    queryKey: ["job-posts-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_posts").select("id,title").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applications-admin", jobFilter],
    queryFn: async () => {
      let q = supabase.from("applications").select("*, job_posts(title, type)").order("applied_at", { ascending: false });
      if (jobFilter !== "all") q = q.eq("job_id", jobFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const setStatus = async (app: any, status: string) => {
    setUpdating(app.id);
    try {
      const { error } = await supabase.from("applications").update({ status }).eq("id", app.id);
      if (error) throw error;
      await supabase.rpc("create_notification", {
        _user_id: app.user_id,
        _title: "Application Update",
        _message: `Your application for "${app.job_posts?.title || "a position"}" is now: ${status}.`,
        _type: status === "selected" ? "success" : status === "rejected" ? "error" : "info",
        _link: "/dashboard/careers/my-applications",
      });
      toast({ title: "Status updated" });
      qc.invalidateQueries({ queryKey: ["applications-admin"] });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Update failed", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const downloadResume = async (path: string) => {
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 10);
    if (error || !data) {
      toast({ title: "Error", description: "Could not access resume.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const statusColor = (s: string) => s === "selected" ? "default" : s === "rejected" ? "destructive" : s === "shortlisted" ? "secondary" : "outline";

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground">Review and manage candidate applications</p>
        </div>
        <Select value={jobFilter} onValueChange={(v) => setParams(v === "all" ? {} : { job: v })}>
          <SelectTrigger className="w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((j: any) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">No applications yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Applications will appear here once candidates apply.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apps.map((app: any) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{app.full_name}</h3>
                      <Badge variant={statusColor(app.status) as any} className="capitalize">{app.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Applied for <span className="text-foreground">{app.job_posts?.title}</span> · {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                    <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <span>📧 {app.email}</span>
                      {app.phone && <span>📞 {app.phone}</span>}
                    </div>
                    {app.cover_letter && (
                      <p className="mt-3 whitespace-pre-wrap rounded-md bg-navy-elevated p-3 text-sm text-muted-foreground">{app.cover_letter}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {app.resume_url && (
                        <Button variant="outline" size="sm" onClick={() => downloadResume(app.resume_url)} className="gap-1.5">
                          <FileDown size={14} /> Resume
                        </Button>
                      )}
                      {app.portfolio_link && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                          <a href={app.portfolio_link} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Portfolio</a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <Select value={app.status} onValueChange={(v) => setStatus(app, v)} disabled={updating === app.id}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CareersApplications;