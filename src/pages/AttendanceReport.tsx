import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, AlertTriangle } from "lucide-react";

const AttendanceReport = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);

  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [bRes, sRes, rRes, pRes, csRes] = await Promise.all([
        supabase.from("batches").select("id, name").eq("is_active", true),
        supabase.from("subjects").select("id, name"),
        supabase.from("attendance_records").select("*").order("date", { ascending: false }),
        supabase.from("profiles").select("user_id, first_name, last_name, email"),
        supabase.from("class_students").select("*"),
      ]);
      setBatches(bRes.data || []);
      setSubjects(sRes.data || []);
      setRecords(rRes.data || []);
      setProfiles(pRes.data || []);
      setClassStudents(csRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = records.filter((r) => {
    if (selectedBatch !== "all" && r.batch_id !== selectedBatch) return false;
    if (selectedSubject !== "all" && r.subject_id !== selectedSubject) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });

  // Per-student aggregation
  const studentMap = new Map<string, { present: number; absent: number; late: number; total: number; roll_number: string }>();
  filtered.forEach((r) => {
    if (!studentMap.has(r.student_id)) {
      const cs = classStudents.find((c: any) => c.student_id === r.student_id);
      studentMap.set(r.student_id, { present: 0, absent: 0, late: 0, total: 0, roll_number: cs?.roll_number || "—" });
    }
    const entry = studentMap.get(r.student_id)!;
    entry.total++;
    if (r.status === "present") entry.present++;
    else if (r.status === "absent") entry.absent++;
    else if (r.status === "late") entry.late++;
  });

  const studentStats = Array.from(studentMap.entries()).map(([sid, stats]) => {
    const p = profiles.find((pr: any) => pr.user_id === sid);
    const name = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : sid;
    const pct = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
    return { student_id: sid, name, ...stats, percentage: pct };
  }).sort((a, b) => a.percentage - b.percentage);

  const lowAttendance = studentStats.filter((s) => s.percentage < 75);

  const exportCSV = () => {
    const header = "Student Name,Roll No,Present,Absent,Late,Total,Percentage\n";
    const rows = studentStats.map((s) => `${s.name},${s.roll_number},${s.present},${s.absent},${s.late},${s.total},${s.percentage}%`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDetailedCSV = () => {
    const header = "Student Name,Roll No,Date,Subject,Lecture,Status\n";
    const rows = filtered.map((r) => {
      const p = profiles.find((pr: any) => pr.user_id === r.student_id);
      const name = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : r.student_id;
      const cs = classStudents.find((c: any) => c.student_id === r.student_id);
      const subj = subjects.find((s) => s.id === r.subject_id)?.name || r.subject_id;
      return `${name},${cs?.roll_number || "—"},${r.date},${subj},${r.lecture_number},${r.status}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_detailed.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Attendance Reports</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={studentStats.length === 0}>
              <Download size={16} className="mr-2" /> Summary CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportDetailedCSV} disabled={filtered.length === 0}>
              <Download size={16} className="mr-2" /> Detailed CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Batches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
          <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
        </div>

        {/* Low Attendance Warning */}
        {lowAttendance.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-amber-400">Low Attendance Alert</p>
                <p className="text-sm text-muted-foreground">{lowAttendance.length} student(s) below 75% attendance: {lowAttendance.map((s) => s.name).join(", ")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Student Attendance Summary</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-steel border-t-transparent" /></div>
            ) : studentStats.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No records found for the selected filters.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentStats.map((s) => (
                    <TableRow key={s.student_id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.roll_number}</TableCell>
                      <TableCell className="text-center text-emerald-400">{s.present}</TableCell>
                      <TableCell className="text-center text-red-400">{s.absent}</TableCell>
                      <TableCell className="text-center text-amber-400">{s.late}</TableCell>
                      <TableCell className="text-center">{s.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={s.percentage < 75 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                          {s.percentage}%
                        </Badge>
                      </TableCell>
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

export default AttendanceReport;
