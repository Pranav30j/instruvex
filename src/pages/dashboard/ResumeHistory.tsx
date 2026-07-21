import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Link } from "react-router-dom";

interface Row {
  id: string;
  file_name: string;
  overall_score: number;
  created_at: string;
  ai_summary: string | null;
}

export default function ResumeHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("resume_analyses")
        .select("id,file_name,overall_score,created_at,ai_summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const best = rows.reduce((m, r) => Math.max(m, r.overall_score), 0);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Resume History</h1>
            <p className="text-muted-foreground mt-1">Track your ATS improvements over time.</p>
          </div>
          <Link to="/ats-checker" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium">Run new analysis</Link>
        </div>

        {!loading && rows.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Stat icon={FileText} label="Total analyses" value={rows.length.toString()} />
            <Stat icon={TrendingUp} label="Best score" value={`${best}/100`} />
            <Stat icon={Calendar} label="Latest" value={new Date(rows[0].created_at).toLocaleDateString("en-IN")} />
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No reports yet</p>
            <p className="text-sm text-muted-foreground mt-1">Run your first ATS scan to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{r.file_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</p>
                  {r.ai_summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.ai_summary}</p>}
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${r.overall_score >= 80 ? "text-emerald-500" : r.overall_score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                    {r.overall_score}
                  </div>
                  <p className="text-xs text-muted-foreground">/100</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}