import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import {
  BarChart3, TrendingUp, Users, Award, Target, BookOpen, Clock, CheckCircle,
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  total_marks: number;
  passing_marks: number;
  status: string;
  created_at: string;
  duration_minutes: number;
}

interface Submission {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  total_score: number | null;
  submitted_at: string | null;
  started_at: string;
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",   // primary
  "hsl(173, 80%, 50%)",   // cyan
  "hsl(280, 67%, 55%)",   // purple
  "hsl(45, 93%, 55%)",    // amber
  "hsl(0, 84%, 60%)",     // red
  "hsl(142, 71%, 45%)",   // green
];

const Analytics = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [exRes, subRes] = await Promise.all([
        supabase.from("exams").select("id, title, total_marks, passing_marks, status, created_at, duration_minutes").eq("created_by", user.id),
        supabase.from("exam_submissions").select("id, exam_id, student_id, status, total_score, submitted_at, started_at"),
      ]);
      if (exRes.data) setExams(exRes.data);
      if (subRes.data) setSubmissions(subRes.data as Submission[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Filter submissions to only those belonging to user's exams
  const examIds = useMemo(() => new Set(exams.map((e) => e.id)), [exams]);
  const mySubmissions = useMemo(() => submissions.filter((s) => examIds.has(s.exam_id)), [submissions, examIds]);
  const gradedSubmissions = useMemo(() => mySubmissions.filter((s) => s.status === "graded" || s.status === "submitted"), [mySubmissions]);

  // ── Summary stats ──
  const totalStudents = useMemo(() => new Set(mySubmissions.map((s) => s.student_id)).size, [mySubmissions]);
  const avgScore = useMemo(() => {
    const scored = gradedSubmissions.filter((s) => s.total_score !== null);
    if (!scored.length) return 0;
    return Math.round(scored.reduce((a, s) => a + (s.total_score ?? 0), 0) / scored.length);
  }, [gradedSubmissions]);

  const overallPassRate = useMemo(() => {
    const scored = gradedSubmissions.filter((s) => s.total_score !== null);
    if (!scored.length) return 0;
    const passed = scored.filter((s) => {
      const exam = exams.find((e) => e.id === s.exam_id);
      return exam && (s.total_score ?? 0) >= exam.passing_marks;
    });
    return Math.round((passed.length / scored.length) * 100);
  }, [gradedSubmissions, exams]);

  // ── Per-exam performance (bar chart) ──
  const examPerformance = useMemo(() => {
    return exams.map((exam) => {
      const subs = gradedSubmissions.filter((s) => s.exam_id === exam.id && s.total_score !== null);
      const avg = subs.length ? Math.round(subs.reduce((a, s) => a + (s.total_score ?? 0), 0) / subs.length) : 0;
      const passCount = subs.filter((s) => (s.total_score ?? 0) >= exam.passing_marks).length;
      const passRate = subs.length ? Math.round((passCount / subs.length) * 100) : 0;
      return {
        name: exam.title.length > 18 ? exam.title.slice(0, 18) + "…" : exam.title,
        avgScore: avg,
        passRate,
        submissions: subs.length,
        totalMarks: exam.total_marks,
      };
    }).filter((e) => e.submissions > 0);
  }, [exams, gradedSubmissions]);

  // ── Score distribution (pie chart) ──
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-20%", count: 0 },
      { range: "21-40%", count: 0 },
      { range: "41-60%", count: 0 },
      { range: "61-80%", count: 0 },
      { range: "81-100%", count: 0 },
    ];
    gradedSubmissions.forEach((s) => {
      if (s.total_score === null) return;
      const exam = exams.find((e) => e.id === s.exam_id);
      if (!exam || exam.total_marks === 0) return;
      const pct = (s.total_score / exam.total_marks) * 100;
      if (pct <= 20) buckets[0].count++;
      else if (pct <= 40) buckets[1].count++;
      else if (pct <= 60) buckets[2].count++;
      else if (pct <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets.filter((b) => b.count > 0);
  }, [gradedSubmissions, exams]);

  // ── Submissions over time (area chart) ──
  const submissionTrend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    mySubmissions.forEach((s) => {
      const date = s.submitted_at || s.started_at;
      const key = date.slice(0, 7); // YYYY-MM
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        submissions: count,
      }));
  }, [mySubmissions]);

  // ── Pass/Fail per exam (stacked bar) ──
  const passFailData = useMemo(() => {
    return exams.map((exam) => {
      const subs = gradedSubmissions.filter((s) => s.exam_id === exam.id && s.total_score !== null);
      const passed = subs.filter((s) => (s.total_score ?? 0) >= exam.passing_marks).length;
      return {
        name: exam.title.length > 15 ? exam.title.slice(0, 15) + "…" : exam.title,
        passed,
        failed: subs.length - passed,
      };
    }).filter((e) => e.passed + e.failed > 0);
  }, [exams, gradedSubmissions]);

  // ── Exam status breakdown ──
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    exams.forEach((e) => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [exams]);

  const statCards = [
    { label: "Total Exams", value: exams.length, icon: BookOpen, color: "text-primary" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-primary" },
    { label: "Avg Score", value: avgScore, icon: Target, color: "text-primary" },
    { label: "Pass Rate", value: `${overallPassRate}%`, icon: Award, color: "text-primary" },
    { label: "Submissions", value: mySubmissions.length, icon: CheckCircle, color: "text-primary" },
    { label: "Graded", value: gradedSubmissions.length, icon: TrendingUp, color: "text-primary" },
  ];

  const customTooltipStyle = {
    backgroundColor: "hsl(222, 44%, 8%)",
    border: "1px solid hsl(222, 30%, 16%)",
    borderRadius: "8px",
    color: "hsl(210, 40%, 93%)",
    fontSize: "12px",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track exam performance, scores, and student engagement</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon size={18} className={s.color} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading analytics…</div>
        ) : exams.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-3 py-16">
              <BarChart3 size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">Create exams and collect submissions to see analytics</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="scores">Score Distribution</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Performance tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Avg score per exam */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Average Score per Exam</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {examPerformance.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No graded submissions yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={examPerformance} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                          <XAxis dataKey="name" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                          <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                          <Tooltip contentStyle={customTooltipStyle} />
                          <Bar dataKey="avgScore" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Avg Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Pass/Fail stacked bar */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Pass vs Fail per Exam</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {passFailData.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No graded submissions yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={passFailData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                          <XAxis dataKey="name" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                          <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                          <Tooltip contentStyle={customTooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="passed" stackId="a" fill={CHART_COLORS[5]} radius={[0, 0, 0, 0]} name="Passed" />
                          <Bar dataKey="failed" stackId="a" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} name="Failed" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Exam status breakdown */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Exam Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {statusBreakdown.map((s) => (
                      <div key={s.status} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-3">
                        <Badge variant={s.status === "published" || s.status === "active" ? "default" : "secondary"} className="capitalize">{s.status}</Badge>
                        <span className="text-lg font-bold text-foreground">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Score distribution tab */}
            <TabsContent value="scores" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scoreDistribution.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No scored submissions yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={scoreDistribution} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={100} label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}>
                            {scoreDistribution.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={customTooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Per-exam pass rate */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Pass Rate per Exam</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {examPerformance.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No graded submissions yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={examPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} unit="%" />
                          <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} width={80} />
                          <Tooltip contentStyle={customTooltipStyle} formatter={(value: number) => `${value}%`} />
                          <Bar dataKey="passRate" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} name="Pass Rate" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends tab */}
            <TabsContent value="trends" className="space-y-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Submissions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissionTrend.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No submission data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={submissionTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
                        <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                        <Tooltip contentStyle={customTooltipStyle} />
                        <Area type="monotone" dataKey="submissions" stroke={CHART_COLORS[0]} fill="url(#colorSubs)" strokeWidth={2} name="Submissions" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top performing exams table */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Exam Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  {examPerformance.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No data</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs text-muted-foreground">
                            <th className="pb-2 font-medium">Exam</th>
                            <th className="pb-2 font-medium">Submissions</th>
                            <th className="pb-2 font-medium">Avg Score</th>
                            <th className="pb-2 font-medium">Total Marks</th>
                            <th className="pb-2 font-medium">Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examPerformance
                            .sort((a, b) => b.passRate - a.passRate)
                            .map((ep) => (
                              <tr key={ep.name} className="border-b border-border/50">
                                <td className="py-2.5 font-medium text-foreground">{ep.name}</td>
                                <td className="py-2.5 text-muted-foreground">{ep.submissions}</td>
                                <td className="py-2.5 text-muted-foreground">{ep.avgScore}</td>
                                <td className="py-2.5 text-muted-foreground">{ep.totalMarks}</td>
                                <td className="py-2.5">
                                  <Badge variant={ep.passRate >= 70 ? "default" : ep.passRate >= 40 ? "secondary" : "destructive"}>
                                    {ep.passRate}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
