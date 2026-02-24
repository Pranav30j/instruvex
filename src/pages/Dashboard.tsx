import { Link } from "react-router-dom";
import {
  FileText, Brain, BarChart3, BookOpen, Award, Users, TrendingUp, Clock, CheckCircle2, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const stats = [
  { label: "Active Exams", value: "12", icon: FileText, change: "+3 this week" },
  { label: "Total Students", value: "1,247", icon: Users, change: "+89 this month" },
  { label: "Pass Rate", value: "78%", icon: TrendingUp, change: "+2.4%" },
  { label: "Certificates", value: "342", icon: Award, change: "+18 issued" },
];

const recentActivity = [
  { text: "AI generated 25 MCQs for Data Structures", time: "2 min ago", icon: Brain },
  { text: "Batch CS-2024 completed midterm exam", time: "1 hour ago", icon: CheckCircle2 },
  { text: "New course published: Machine Learning 101", time: "3 hours ago", icon: BookOpen },
  { text: "Certificate issued to 15 students", time: "5 hours ago", icon: Award },
];

const Dashboard = () => {
  const { profile } = useAuth();

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : profile?.email || "User";

  return (
    <DashboardLayout>
      <h1 className="font-display text-lg font-semibold text-foreground mb-1">Dashboard</h1>
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
    </DashboardLayout>
  );
};

export default Dashboard;
