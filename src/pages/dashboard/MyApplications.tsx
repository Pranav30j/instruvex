import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MyApplications = () => {
  const { user } = useAuth();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["my-applications-list", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*, job_posts(id, title, type, work_mode, location, status)")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const statusColor = (s: string) => s === "selected" ? "default" : s === "rejected" ? "destructive" : s === "shortlisted" ? "secondary" : "outline";

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Applications</h1>
          <p className="text-sm text-muted-foreground">Track the status of your job & internship applications</p>
        </div>
        <Button asChild variant="hero" className="gap-2"><Link to="/careers"><Send size={16} /> Browse Jobs</Link></Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">No applications yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse open positions and start applying.</p>
            <Button asChild variant="hero" size="sm" className="mt-4"><Link to="/careers">View Careers</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {apps.map((app: any) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold">{app.job_posts?.title || "Position"}</h3>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {app.job_posts?.type} · {app.job_posts?.work_mode}{app.job_posts?.location ? ` · ${app.job_posts.location}` : ""}
                    </p>
                  </div>
                  <Badge variant={statusColor(app.status) as any} className="capitalize">{app.status}</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                {app.job_posts?.id && (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link to={`/careers/${app.job_posts.id}`}>View Position</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyApplications;