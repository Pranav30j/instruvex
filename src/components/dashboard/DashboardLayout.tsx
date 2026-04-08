import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Brain, BarChart3, BookOpen, Award, Users, Settings, LogOut, Menu, X, Building2, GraduationCap, ShieldCheck, ChevronDown, PenSquare, ClipboardList, CalendarCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "./NotificationBell";

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  institute_admin: "Institute Admin",
  instructor: "Instructor",
  student: "Student",
  academy_learner: "Academy Learner",
};

interface SidebarItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles?: AppRole[]; // if undefined, visible to all
}

const allSidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: FileText, label: "Examinations", path: "/dashboard/exams", roles: ["super_admin", "institute_admin", "instructor", "student"] },
  { icon: Brain, label: "AI Generator", path: "/dashboard/ai", roles: ["super_admin", "instructor"] },
  { icon: BookOpen, label: "Question Bank", path: "/dashboard/questions", roles: ["super_admin", "instructor", "student"] },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics", roles: ["super_admin", "institute_admin", "instructor"] },
  { icon: Award, label: "Certifications", path: "/dashboard/certs", roles: ["super_admin", "institute_admin"] },
  { icon: Users, label: "Students", path: "/dashboard/students", roles: ["super_admin", "institute_admin", "instructor"] },
  { icon: Building2, label: "Institutions", path: "/dashboard/institutions", roles: ["super_admin", "institute_admin"] },
  { icon: GraduationCap, label: "Academy", path: "/dashboard/academy" },
  { icon: ClipboardList, label: "Assignments", path: "/dashboard/assignments", roles: ["super_admin", "institute_admin", "instructor", "student"] },
  { icon: CalendarCheck, label: "Attendance", path: "/dashboard/attendance", roles: ["super_admin", "institute_admin", "instructor", "student"] },
  { icon: ShieldCheck, label: "User Roles", path: "/dashboard/roles", roles: ["super_admin", "institute_admin"] },
  { icon: PenSquare, label: "Blog", path: "/dashboard/blog", roles: ["super_admin", "institute_admin"] },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, activeRole, roles, switchRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleRoleSwitch = (role: AppRole) => {
    switchRole(role);
    toast({ title: "Role switched", description: `Now viewing as ${ROLE_LABELS[role]}` });
  };

  const initials = profile?.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`.toUpperCase()
    : "U";

  const displayRole = activeRole ? ROLE_LABELS[activeRole] : "Learner";

  const filteredItems = allSidebarItems.filter(
    (item) => !item.roles || (activeRole && item.roles.includes(activeRole))
  );

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const NavItems = () => (
    <>
      {filteredItems.map((item) => (
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
        <nav className="flex-1 space-y-1 overflow-y-auto p-4"><NavItems /></nav>
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
              <nav className="flex-1 space-y-1 overflow-y-auto p-4"><NavItems /></nav>
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
            {roles.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden items-center gap-1.5 rounded-md bg-steel/10 px-2.5 py-1 text-xs text-steel transition-colors hover:bg-steel/20 sm:flex">
                    {displayRole}
                    <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {roles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={role === activeRole ? "bg-steel/10 font-medium text-steel" : ""}
                    >
                      {ROLE_LABELS[role]}
                      {role === activeRole && " ✓"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="hidden rounded-md bg-steel/10 px-2.5 py-1 text-xs text-steel sm:block">{displayRole}</span>
            )}
            <NotificationBell />
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
