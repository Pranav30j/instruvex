import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const ManageAttendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Subjects
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");

  // Class-Subject mappings
  const [batches, setBatches] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [csForm, setCsForm] = useState({ batch_id: "", subject_id: "", instructor_id: "" });

  // Class-Students
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [csStudentForm, setCsStudentForm] = useState({ batch_id: "", student_email: "", roll_number: "" });

  const [profiles, setProfiles] = useState<any[]>([]);

  const refresh = async () => {
    const [sRes, bRes, csRes, cstRes, pRes] = await Promise.all([
      supabase.from("subjects").select("*").order("name"),
      supabase.from("batches").select("id, name").eq("is_active", true),
      supabase.from("class_subjects").select("*"),
      supabase.from("class_students").select("*"),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
    ]);
    setSubjects(sRes.data || []);
    setBatches(bRes.data || []);
    setClassSubjects(csRes.data || []);
    setClassStudents(cstRes.data || []);
    setProfiles(pRes.data || []);
  };

  useEffect(() => { refresh(); }, []);

  const getProfileName = (userId: string) => {
    const p = profiles.find((pr: any) => pr.user_id === userId);
    return p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : userId;
  };

  const addSubject = async () => {
    if (!newSubjectName.trim() || !user) return;
    const { error } = await supabase.from("subjects").insert({ name: newSubjectName.trim(), code: newSubjectCode.trim() || null, created_by: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewSubjectName(""); setNewSubjectCode("");
    toast({ title: "Subject added" });
    refresh();
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Subject deleted" });
    refresh();
  };

  const addClassSubject = async () => {
    if (!csForm.batch_id || !csForm.subject_id || !csForm.instructor_id) return;
    // Find instructor by email
    const profile = profiles.find((p: any) => p.email === csForm.instructor_id);
    const instructorId = profile?.user_id || csForm.instructor_id;
    const { error } = await supabase.from("class_subjects").insert({ batch_id: csForm.batch_id, subject_id: csForm.subject_id, instructor_id: instructorId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setCsForm({ batch_id: "", subject_id: "", instructor_id: "" });
    toast({ title: "Class-Subject mapping added" });
    refresh();
  };

  const addClassStudent = async () => {
    if (!csStudentForm.batch_id || !csStudentForm.student_email) return;
    const profile = profiles.find((p: any) => p.email === csStudentForm.student_email);
    if (!profile) { toast({ title: "Student not found", description: "No user with that email", variant: "destructive" }); return; }
    const { error } = await supabase.from("class_students").insert({ batch_id: csStudentForm.batch_id, student_id: profile.user_id, roll_number: csStudentForm.roll_number || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setCsStudentForm({ batch_id: "", student_email: "", roll_number: "" });
    toast({ title: "Student added to class" });
    refresh();
  };

  const removeClassStudent = async (id: string) => {
    await supabase.from("class_students").delete().eq("id", id);
    toast({ title: "Student removed" });
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Attendance</h1>

        <Tabs defaultValue="subjects">
          <TabsList>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="mapping">Class ↔ Subject</TabsTrigger>
            <TabsTrigger value="students">Class ↔ Students</TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Subject</CardTitle></CardHeader>
              <CardContent className="flex gap-3">
                <Input placeholder="Subject name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} />
                <Input placeholder="Code (optional)" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} className="w-32" />
                <Button onClick={addSubject}><Plus size={16} className="mr-1" /> Add</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {subjects.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.code || "—"}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteSubject(s.id)}><Trash2 size={14} className="text-red-400" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {subjects.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No subjects yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Class-Subject Tab */}
          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Assign Subject to Class</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select value={csForm.batch_id} onValueChange={(v) => setCsForm({ ...csForm, batch_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger>
                    <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={csForm.subject_id} onValueChange={(v) => setCsForm({ ...csForm, subject_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Instructor email" value={csForm.instructor_id} onChange={(e) => setCsForm({ ...csForm, instructor_id: e.target.value })} />
                </div>
                <Button onClick={addClassSubject}><Plus size={16} className="mr-1" /> Assign</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Batch</TableHead><TableHead>Subject</TableHead><TableHead>Instructor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {classSubjects.map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell>{batches.find((b) => b.id === cs.batch_id)?.name || cs.batch_id}</TableCell>
                        <TableCell>{subjects.find((s) => s.id === cs.subject_id)?.name || cs.subject_id}</TableCell>
                        <TableCell>{getProfileName(cs.instructor_id)}</TableCell>
                      </TableRow>
                    ))}
                    {classSubjects.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No mappings yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Class-Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Student to Class</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select value={csStudentForm.batch_id} onValueChange={(v) => setCsStudentForm({ ...csStudentForm, batch_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger>
                    <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Student email" value={csStudentForm.student_email} onChange={(e) => setCsStudentForm({ ...csStudentForm, student_email: e.target.value })} />
                  <Input placeholder="Roll number" value={csStudentForm.roll_number} onChange={(e) => setCsStudentForm({ ...csStudentForm, roll_number: e.target.value })} />
                </div>
                <Button onClick={addClassStudent}><Plus size={16} className="mr-1" /> Add Student</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Batch</TableHead><TableHead>Student</TableHead><TableHead>Roll No</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {classStudents.map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell>{batches.find((b) => b.id === cs.batch_id)?.name || cs.batch_id}</TableCell>
                        <TableCell>{getProfileName(cs.student_id)}</TableCell>
                        <TableCell>{cs.roll_number || "—"}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeClassStudent(cs.id)}><Trash2 size={14} className="text-red-400" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {classStudents.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No students assigned</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManageAttendance;
