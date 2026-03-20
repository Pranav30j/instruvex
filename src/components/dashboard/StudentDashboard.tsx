import { Link } from "react-router-dom";
import { FileText, GraduationCap, Award, BarChart3, Clock, ChevronRight, BookOpen } from "lucide-react";

const stats = [
  { label: "Upcoming Exams", value: "3", icon: FileText, change: "Next: Tomorrow" },
  { label: "Enrolled Courses", value: "5", icon: GraduationCap, change: "2 in progress" },
  { label: "Certificates", value: "4", icon: Award, change: "+1 this month" },
  { label: "Avg. Score", value: "82%", icon: BarChart3, change: "+3.2% improvement" },
];

const recentActivity = [
  { text: "Completed Module 3: Neural Networks", time: "30 min ago", icon: BookOpen },
  { text: "Scored 87% on Data Structures Exam", time: "2 hours ago", icon: BarChart3 },
  { text: "Enrolled in Machine Learning 101", time: "1 day ago", icon: GraduationCap },
  { text: "Certificate issued: Python Fundamentals", time: "3 days ago", icon: Award },
];

const StudentDashboard = ({ displayName }: { displayName: string }) => (
  <>
    <h1 className="font-display text-lg font-semibold text-foreground mb-1">Student Dashboard</h1>
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
          <Link to="/dashboard/exams" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <FileText size={18} className="text-steel" />
            <span className="text-sm text-foreground">Browse Exams</span>
          </Link>
          <Link to="/dashboard/academy" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <GraduationCap size={18} className="text-steel" />
            <span className="text-sm text-foreground">Continue Learning</span>
          </Link>
          <Link to="/dashboard/questions" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-navy-elevated">
            <BookOpen size={18} className="text-steel" />
            <span className="text-sm text-foreground">Practice Questions</span>
          </Link>
        </div>
      </div>
    </div>
  </>
);

export default StudentDashboard;
