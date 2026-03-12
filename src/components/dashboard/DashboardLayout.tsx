import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Brain, BarChart3, BookOpen, Award, Users, Settings, LogOut, Menu, X, Bell, Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: FileText, label: "Examinations", path: "/dashboard/exams" },
  { icon: Brain, label: "AI Generator", path: "/dashboard/ai" },
  { icon: BookOpen, label: "Question Bank", path: "/dashboard/questions" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Award, label: "Certifications", path: "/dashboard/certs" },
  { icon: Users, label: "Students", path: "/dashboard/students" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`.toUpperCase()
    : "U";

  const primaryRole = roles[0]?.replace("_", " ") || "Learner";

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const NavItems = () => (
    <>
      {sidebarItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          onClick={() => setSidebarOpen(false)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            isActive(item.path)
              ? "bg-steel/10 font-medium text-steel"
              : "text-muted-foreground hover:bg-navy-elevated hover:text-foreground"
          }`}
        >
          <item.icon size={18} />
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-navy-deep lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-steel to-cyan-accent">
            <span className="font-display text-xs font-bold text-primary-foreground">IX</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">Instruvex</span>
        </div>
        <nav className="flex-1 space-y-1 p-4"><NavItems /></nav>
        <div className="border-t border-border p-4">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-navy-elevated hover:text-foreground">
            <LogOut size={18} /> Sign Out
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
              <nav className="flex-1 space-y-1 p-4"><NavItems /></nav>
              <div className="border-t border-border p-4">
                <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-navy-elevated hover:text-foreground">
                  <LogOut size={18} /> Sign Out
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
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
