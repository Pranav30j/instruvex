import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Brain, BarChart3, BookOpen, Award, Users, Settings, LogOut, Menu, X, Bell, ChevronRight, TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: FileText, label: "Examinations" },
  { icon: Brain, label: "AI Generator" },
  { icon: BookOpen, label: "Question Bank" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Award, label: "Certifications" },
  { icon: Users, label: "Students" },
  { icon: Settings, label: "Settings" },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : profile?.email || "User";

  const initials = profile?.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`.toUpperCase()
    : "U";

  const primaryRole = roles[0]?.replace("_", " ") || "Learner";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-navy-deep lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-steel to-cyan-accent">
            <span className="font-display text-xs font-bold text-primary-foreground">IX</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">Instruvex</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {sidebarItems.map((item) => (
            <button key={item.label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${item.active ? "bg-steel/10 font-medium text-steel" : "text-muted-foreground hover:bg-navy-elevated hover:text-foreground"}`}>
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-navy-elevated hover:text-foreground">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-navy-deep/80 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25 }} className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-navy-deep lg:hidden">
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <span className="font-display text-lg font-bold text-foreground">Instruvex</span>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground"><X size={20} /></button>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {sidebarItems.map((item) => (
                  <button key={item.label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${item.active ? "bg-steel/10 font-medium text-steel" : "text-muted-foreground hover:bg-navy-elevated hover:text-foreground"}`}>
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="border-t border-border p-4">
                <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-navy-elevated hover:text-foreground">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <h1 className="font-display text-lg font-semibold text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs capitalize text-muted-foreground sm:block">{primaryRole}</span>
            <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-navy-elevated hover:text-foreground">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-steel" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-steel/20 text-sm font-medium text-steel">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
