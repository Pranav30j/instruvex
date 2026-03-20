import { Link } from "react-router-dom";
import { Building2, Users, BarChart3, Award, Clock, ChevronRight, Globe, DollarSign } from "lucide-react";

const stats = [
  { label: "Total Institutes", value: "24", icon: Building2, change: "+3 this quarter" },
  { label: "Total Users", value: "14,832", icon: Users, change: "+1,247 this month" },
  { label: "Active Certs", value: "2,841", icon: Award, change: "+312 issued" },
  { label: "Platform Health", value: "99.8%", icon: Globe, change: "Uptime" },
];

const recentActivity = [
  { text: "New institute onboarded: Delhi Tech University", time: "15 min ago", icon: Building2 },
  { text: "Platform update deployed: v2.4.1", time: "2 hours ago", icon: Globe },
  { text: "1,200 certificates verified today", time: "4 hours ago", icon: Award },
  { text: "Revenue milestone: ₹5L MRR reached", time: "1 day ago", icon: DollarSign },
];

const SuperAdminDashboard = ({ displayName }: { displayName: string }) => (
  <>
    <h1 className="font-display text-lg font-semibold text-foreground mb-1">Super Admin Dashboard</h1>
    <p className="mb-6 text-muted-foreground">Welcome back, <span className="text-foreground font-medium">{displayName}</span></p>

    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card-gradient p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <s.icon size={18} className="text-steel" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
          <p className="mt-1 text-xs text-steel">{s.change}</p>
        </div>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-steel/10 text-steel"><a.icon size={16} /></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{a.text}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock size={12} /> {a.time}</p>
              </div>
              <ChevronRight size={16} className="mt-1 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="space-y-3">
          <Link to="/dashboard/institutions" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <Building2 size={18} className="text-steel" />
            <span className="text-sm text-foreground">Manage Institutes</span>
          </Link>
          <Link to="/dashboard/roles" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <Users size={18} className="text-steel" />
            <span className="text-sm text-foreground">Manage User Roles</span>
          </Link>
          <Link to="/dashboard/analytics" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <BarChart3 size={18} className="text-steel" />
            <span className="text-sm text-foreground">Platform Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  </>
);

export default SuperAdminDashboard;
