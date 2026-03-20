import { Link } from "react-router-dom";
import { FileText, Brain, Users, BarChart3, Clock, ChevronRight, BookOpen, CheckCircle2 } from "lucide-react";

const stats = [
  { label: "My Exams", value: "8", icon: FileText, change: "3 active" },
  { label: "Total Students", value: "247", icon: Users, change: "+12 this week" },
  { label: "Questions Created", value: "184", icon: Brain, change: "+15 this month" },
  { label: "Avg. Pass Rate", value: "74%", icon: BarChart3, change: "+1.8%" },
];

const recentActivity = [
  { text: "AI generated 25 MCQs for Data Structures", time: "2 min ago", icon: Brain },
  { text: "Batch CS-2024 completed midterm exam", time: "1 hour ago", icon: CheckCircle2 },
  { text: "Published new course: Machine Learning 101", time: "3 hours ago", icon: BookOpen },
  { text: "Graded 32 subjective answers", time: "5 hours ago", icon: FileText },
];

const InstructorDashboard = ({ displayName }: { displayName: string }) => (
  <>
    <h1 className="font-display text-lg font-semibold text-foreground mb-1">Instructor Dashboard</h1>
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
          <Link to="/dashboard/exams/create" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <FileText size={18} className="text-steel" />
            <span className="text-sm text-foreground">Create Exam</span>
          </Link>
          <Link to="/dashboard/ai" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <Brain size={18} className="text-steel" />
            <span className="text-sm text-foreground">AI Question Generator</span>
          </Link>
          <Link to="/dashboard/students" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <Users size={18} className="text-steel" />
            <span className="text-sm text-foreground">View Students</span>
          </Link>
        </div>
      </div>
    </div>
  </>
);

export default InstructorDashboard;
