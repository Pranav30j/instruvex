import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  lecture_number: number;
  subject_id: string;
  batch_id: string;
}

interface SubjectInfo {
  id: string;
  name: string;
}

const AttendanceHome = () => {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [recordsRes, subjectsRes] = await Promise.all([
        supabase.from("attendance_records").select("*").eq("student_id", user.id).order("date", { ascending: false }),
        supabase.from("subjects").select("id, name"),
      ]);
      setRecords((recordsRes.data || []) as AttendanceRecord[]);
      setSubjects((subjectsRes.data || []) as SubjectInfo[]);
      setLoading(false);
    };

    if (activeRole === "student" || activeRole === "academy_learner") {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, activeRole]);

  const filteredRecords = selectedSubject === "all" ? records : records.filter((r) => r.subject_id === selectedSubject);

  const totalClasses = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === "present").length;
  const absentCount = filteredRecords.filter((r) => r.status === "absent").length;
  const lateCount = filteredRecords.filter((r) => r.status === "late").length;
  const percentage = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0;

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || "—";

  const statusBadge = (status: string) => {
    switch (status) {
      case "present": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Present</Badge>;
      case "absent": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Absent</Badge>;
      case "late": return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Late</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const exportCSV = () => {
    const header = "Date,Subject,Lecture,Status\n";
    const rows = filteredRecords.map((r) => `${r.date},${getSubjectName(r.subject_id)},${r.lecture_number},${r.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_attendance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Non-student roles see a redirect/overview
  if (activeRole && !["student", "academy_learner"].includes(activeRole)) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Attendance Management</h1>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:border-steel/50 transition-colors" onClick={() => navigate("/dashboard/attendance/take")}>
              <CardHeader><CardTitle className="text-base">Take Attendance</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Mark attendance for your classes</p></CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-steel/50 transition-colors" onClick={() => navigate("/dashboard/attendance/manage")}>
              <CardHeader><CardTitle className="text-base">Manage</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Manage subjects, classes & students</p></CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-steel/50 transition-colors" onClick={() => navigate("/dashboard/attendance/report")}>
              <CardHeader><CardTitle className="text-base">Reports</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">View analytics & export CSV</p></CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredRecords.length === 0}>
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CalendarDays className="text-steel" size={24} />
              <div><p className="text-2xl font-bold text-foreground">{totalClasses}</p><p className="text-xs text-muted-foreground">Total Classes</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle className="text-emerald-400" size={24} />
              <div><p className="text-2xl font-bold text-foreground">{presentCount}</p><p className="text-xs text-muted-foreground">Present</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <XCircle className="text-red-400" size={24} />
              <div><p className="text-2xl font-bold text-foreground">{absentCount}</p><p className="text-xs text-muted-foreground">Absent</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock className="text-amber-400" size={24} />
              <div>
                <p className={`text-2xl font-bold ${percentage < 75 ? "text-red-400" : "text-emerald-400"}`}>{percentage}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Records Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-steel border-t-transparent" /></div>
            ) : filteredRecords.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No attendance records found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Lecture</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getSubjectName(r.subject_id)}</TableCell>
                      <TableCell>{r.lecture_number}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceHome;
