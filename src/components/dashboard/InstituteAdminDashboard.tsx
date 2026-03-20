import { Link } from "react-router-dom";
import { Users, Building2, FileText, BarChart3, Clock, ChevronRight, Award, GraduationCap } from "lucide-react";

const stats = [
  { label: "Total Students", value: "1,247", icon: Users, change: "+89 this month" },
  { label: "Faculty Members", value: "38", icon: GraduationCap, change: "4 departments" },
  { label: "Active Exams", value: "12", icon: FileText, change: "3 this week" },
  { label: "Certificates", value: "342", icon: Award, change: "+18 issued" },
];

const recentActivity = [
  { text: "New department created: Computer Science", time: "1 hour ago", icon: Building2 },
  { text: "15 students enrolled in Batch 2026", time: "3 hours ago", icon: Users },
  { text: "Instructor Dr. Sharma assigned to AI course", time: "5 hours ago", icon: GraduationCap },
  { text: "Mid-term results published for Batch CS-2024", time: "1 day ago", icon: BarChart3 },
];

const InstituteAdminDashboard = ({ displayName }: { displayName: string }) => (
  <>
    <h1 className="font-display text-lg font-semibold text-foreground mb-1">Institute Dashboard</h1>
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
            <span className="text-sm text-foreground">Manage Institute</span>
          </Link>
          <Link to="/dashboard/students" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <Users size={18} className="text-steel" />
            <span className="text-sm text-foreground">Manage Students</span>
          </Link>
          <Link to="/dashboard/roles" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <Award size={18} className="text-steel" />
            <span className="text-sm text-foreground">Assign Roles</span>
          </Link>
        </div>
      </div>
    </div>
  </>
);

export default InstituteAdminDashboard;
