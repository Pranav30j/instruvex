import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

interface BatchInfo { id: string; name: string; }
interface SubjectInfo { id: string; name: string; }
interface ClassSubject { id: string; batch_id: string; subject_id: string; }
interface StudentRow { id: string; student_id: string; roll_number: string | null; }
interface ProfileInfo { user_id: string; first_name: string | null; last_name: string | null; email: string | null; }

type Status = "present" | "absent" | "late";

const TakeAttendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lectureNumber, setLectureNumber] = useState(1);

  const [students, setStudents] = useState<(StudentRow & { profile?: ProfileInfo })[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [bRes, sRes, csRes] = await Promise.all([
        supabase.from("batches").select("id, name").eq("is_active", true),
        supabase.from("subjects").select("id, name"),
        supabase.from("class_subjects").select("id, batch_id, subject_id"),
      ]);
      setBatches((bRes.data || []) as BatchInfo[]);
      setSubjects((sRes.data || []) as SubjectInfo[]);
      setClassSubjects((csRes.data || []) as ClassSubject[]);
    };
    fetch();
  }, []);

  const availableSubjects = classSubjects
    .filter((cs) => cs.batch_id === selectedBatch)
    .map((cs) => subjects.find((s) => s.id === cs.subject_id))
    .filter(Boolean) as SubjectInfo[];

  const loadStudents = async () => {
    if (!selectedBatch || !selectedSubject) {
      toast({ title: "Please select batch and subject", variant: "destructive" });
      return;
    }

    const { data: classStudents } = await supabase
      .from("class_students")
      .select("id, student_id, roll_number")
      .eq("batch_id", selectedBatch);

    if (!classStudents?.length) {
      toast({ title: "No students found in this class", variant: "destructive" });
      return;
    }

    const studentIds = classStudents.map((s) => s.student_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, email").in("user_id", studentIds);

    const merged = classStudents.map((s) => ({
      ...s,
      profile: (profiles || []).find((p) => p.user_id === s.student_id) as ProfileInfo | undefined,
    }));

    // Check for existing records
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .eq("batch_id", selectedBatch)
      .eq("subject_id", selectedSubject)
      .eq("date", date)
      .eq("lecture_number", lectureNumber);

    const existingMap: Record<string, Status> = {};
    (existing || []).forEach((e: any) => { existingMap[e.student_id] = e.status; });

    const initial: Record<string, Status> = {};
    merged.forEach((s) => { initial[s.student_id] = existingMap[s.student_id] || "present"; });

    setStudents(merged);
    setStatuses(initial);
    setStep(2);
  };

  const markAll = (status: Status) => {
    const next = { ...statuses };
    students.forEach((s) => { next[s.student_id] = status; });
    setStatuses(next);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const records = students.map((s) => ({
      student_id: s.student_id,
      batch_id: selectedBatch,
      subject_id: selectedSubject,
      date,
      lecture_number: lectureNumber,
      status: statuses[s.student_id],
      marked_by: user.id,
    }));

    // Upsert based on unique constraint
    const { error } = await supabase.from("attendance_records").upsert(records, {
      onConflict: "student_id,batch_id,subject_id,date,lecture_number",
    });

    setSaving(false);

    if (error) {
      toast({ title: "Error saving attendance", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Attendance saved successfully!" });
      // Send notifications for absent students
      const absentStudents = students.filter((s) => statuses[s.student_id] === "absent");
      for (const s of absentStudents) {
        await supabase.rpc("create_notification", {
          _user_id: s.student_id,
          _title: "Marked Absent",
          _message: `You were marked absent on ${date}.`,
          _type: "warning",
          _link: "/dashboard/attendance",
        });
      }
    }
  };

  const statusIcon = (status: Status) => {
    switch (status) {
      case "present": return <CheckCircle size={16} className="text-emerald-400" />;
      case "absent": return <XCircle size={16} className="text-red-400" />;
      case "late": return <Clock size={16} className="text-amber-400" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Take Attendance</h1>

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Select Class Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Batch / Class</label>
                  <Select value={selectedBatch} onValueChange={(v) => { setSelectedBatch(v); setSelectedSubject(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                    <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedBatch}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{availableSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Lecture Number</label>
                  <Input type="number" min={1} max={10} value={lectureNumber} onChange={(e) => setLectureNumber(Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={loadStudents} disabled={!selectedBatch || !selectedSubject}>
                <Users size={16} className="mr-2" /> Load Students
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {batches.find((b) => b.id === selectedBatch)?.name} — {subjects.find((s) => s.id === selectedSubject)?.name} — {date} (L{lectureNumber})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Back</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => markAll("present")} className="text-emerald-400 border-emerald-500/30">Mark All Present</Button>
                <Button size="sm" variant="outline" onClick={() => markAll("absent")} className="text-red-400 border-red-500/30">Mark All Absent</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{s.profile ? `${s.profile.first_name || ""} ${s.profile.last_name || ""}`.trim() || s.profile.email : "Unknown"}</TableCell>
                      <TableCell>{s.roll_number || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(["present", "absent", "late"] as Status[]).map((st) => (
                            <Button
                              key={st}
                              size="sm"
                              variant={statuses[s.student_id] === st ? "default" : "ghost"}
                              className={statuses[s.student_id] === st ? (
                                st === "present" ? "bg-emerald-600 hover:bg-emerald-700" :
                                st === "absent" ? "bg-red-600 hover:bg-red-700" :
                                "bg-amber-600 hover:bg-amber-700"
                              ) : ""}
                              onClick={() => setStatuses({ ...statuses, [s.student_id]: st })}
                            >
                              {statusIcon(st)}
                              <span className="ml-1 hidden sm:inline capitalize">{st}</span>
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  <Badge variant="secondary" className="mr-2">P: {Object.values(statuses).filter((s) => s === "present").length}</Badge>
                  <Badge variant="secondary" className="mr-2">A: {Object.values(statuses).filter((s) => s === "absent").length}</Badge>
                  <Badge variant="secondary">L: {Object.values(statuses).filter((s) => s === "late").length}</Badge>
                </p>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Attendance"}</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TakeAttendance;
