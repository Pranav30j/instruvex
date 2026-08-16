import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Star, Loader2 } from "lucide-react";

interface AcademicYear {
  id: string;
  institute_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_current: boolean;
}

interface Section {
  id: string;
  batch_id: string;
  academic_year_id: string | null;
  name: string;
  code: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  institute_id: string | null;
  department_id: string | null;
}

interface BatchOption {
  id: string;
  name: string;
  department_id: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

interface Props {
  institutionId: string | null;
  institutionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const NONE = "__none__";

const InstitutionAcademicsDialog = ({ institutionId, institutionName, open, onOpenChange, onChanged }: Props) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const [yearForm, setYearForm] = useState({ name: "", start_date: "", end_date: "" });
  const [sectionForm, setSectionForm] = useState({ batch_id: "", name: "", code: "", academic_year_id: NONE });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", department_id: NONE });

  const load = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    const [yearRes, deptRes, batchRes, subjectRes] = await Promise.all([
      supabase.from("academic_years").select("*").eq("institute_id", institutionId).order("name"),
      supabase.from("departments").select("id, name").eq("institute_id", institutionId).order("name"),
      supabase.from("batches").select("id, name, department_id").eq("institute_id", institutionId).order("name"),
      supabase.from("subjects").select("id, name, code, institute_id, department_id").eq("institute_id", institutionId).order("name"),
    ]);
    if (yearRes.error) toast.error(yearRes.error.message);
    setYears((yearRes.data ?? []) as AcademicYear[]);
    setDepartments((deptRes.data ?? []) as DepartmentOption[]);
    const batchList = (batchRes.data ?? []) as BatchOption[];
    setBatches(batchList);
    setSubjects((subjectRes.data ?? []) as Subject[]);

    if (batchList.length > 0) {
      const { data } = await supabase
        .from("sections")
        .select("id, batch_id, academic_year_id, name, code")
        .in("batch_id", batchList.map((b) => b.id))
        .order("name");
      setSections((data ?? []) as Section[]);
    } else {
      setSections([]);
    }
    setLoading(false);
  }, [institutionId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const refresh = async () => {
    await load();
    onChanged?.();
  };

  // Academic years
  const addYear = async () => {
    if (!institutionId || !yearForm.name.trim()) { toast.error("Academic year name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("academic_years").insert({
      institute_id: institutionId,
      name: yearForm.name.trim(),
      start_date: yearForm.start_date || null,
      end_date: yearForm.end_date || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "That academic year already exists" : error.message); return; }
    setYearForm({ name: "", start_date: "", end_date: "" });
    toast.success("Academic year added");
    void refresh();
  };

  const setCurrentYear = async (year: AcademicYear) => {
    if (!institutionId) return;
    setSaving(true);
    const { error: clearError } = await supabase
      .from("academic_years")
      .update({ is_current: false })
      .eq("institute_id", institutionId)
      .eq("is_current", true);
    if (clearError) { setSaving(false); toast.error(clearError.message); return; }
    const { error } = await supabase.from("academic_years").update({ is_current: true }).eq("id", year.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${year.name} is now the current academic year`);
    void refresh();
  };

  const deleteYear = async (id: string) => {
    const { error } = await supabase.from("academic_years").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Academic year removed");
    void refresh();
  };

  // Sections
  const addSection = async () => {
    if (!sectionForm.batch_id) { toast.error("Select a batch / class"); return; }
    if (!sectionForm.name.trim()) { toast.error("Section name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("sections").insert({
      batch_id: sectionForm.batch_id,
      name: sectionForm.name.trim(),
      code: sectionForm.code.trim() || null,
      academic_year_id: sectionForm.academic_year_id === NONE ? null : sectionForm.academic_year_id,
    });
    setSaving(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "That section already exists in this batch" : error.message); return; }
    setSectionForm({ ...sectionForm, name: "", code: "" });
    toast.success("Section added");
    void refresh();
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Section removed");
    void refresh();
  };

  // Subjects
  const addSubject = async () => {
    if (!institutionId || !subjectForm.name.trim()) { toast.error("Subject name is required"); return; }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { toast.error("You must be signed in"); return; }
    setSaving(true);
    const { error } = await supabase.from("subjects").insert({
      name: subjectForm.name.trim(),
      code: subjectForm.code.trim() || null,
      institute_id: institutionId,
      department_id: subjectForm.department_id === NONE ? null : subjectForm.department_id,
      created_by: userData.user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setSubjectForm({ name: "", code: "", department_id: NONE });
    toast.success("Subject added");
    void refresh();
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Subject removed");
    void refresh();
  };

  const batchName = (id: string) => batches.find((b) => b.id === id)?.name ?? "—";
  const yearName = (id: string | null) => (id ? years.find((y) => y.id === id)?.name ?? "—" : "—");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Academic Structure — {institutionName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="years">
            <TabsList>
              <TabsTrigger value="years">Academic Years</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            {/* Academic years */}
            <TabsContent value="years" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Label>Name *</Label>
                  <Input value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} placeholder="2026-27" />
                </div>
                <div><Label>Start</Label><Input type="date" value={yearForm.start_date} onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })} /></div>
                <div><Label>End</Label><Input type="date" value={yearForm.end_date} onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })} /></div>
              </div>
              <Button size="sm" className="gap-1" onClick={addYear} disabled={saving}><Plus size={14} /> Add Academic Year</Button>

              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((y) => (
                    <TableRow key={y.id}>
                      <TableCell className="font-medium">{y.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{y.start_date || "—"} → {y.end_date || "—"}</TableCell>
                      <TableCell>{y.is_current ? <Badge>Current</Badge> : <Badge variant="secondary">{y.status}</Badge>}</TableCell>
                      <TableCell className="text-right">
                        {!y.is_current && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Set as current" onClick={() => setCurrentYear(y)} disabled={saving}><Star size={13} /></Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteYear(y.id)}><Trash2 size={13} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {years.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No academic years yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Sections */}
            <TabsContent value="sections" className="space-y-4">
              {batches.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Create a department and batch first.</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <Label>Batch / Class *</Label>
                      <Select value={sectionForm.batch_id} onValueChange={(v) => setSectionForm({ ...sectionForm, batch_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Name *</Label><Input value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="Section A" /></div>
                    <div><Label>Code</Label><Input value={sectionForm.code} onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value })} placeholder="A" /></div>
                    <div>
                      <Label>Academic Year</Label>
                      <Select value={sectionForm.academic_year_id} onValueChange={(v) => setSectionForm({ ...sectionForm, academic_year_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>None</SelectItem>
                          {years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button size="sm" className="gap-1" onClick={addSection} disabled={saving}><Plus size={14} /> Add Section</Button>

                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Section</TableHead><TableHead>Batch</TableHead><TableHead>Academic Year</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}{s.code ? ` (${s.code})` : ""}</TableCell>
                          <TableCell>{batchName(s.batch_id)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{yearName(s.academic_year_id)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSection(s.id)}><Trash2 size={13} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sections.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No sections yet</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </>
              )}
            </TabsContent>

            {/* Subjects */}
            <TabsContent value="subjects" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><Label>Name *</Label><Input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Mathematics" /></div>
                <div><Label>Code</Label><Input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="MATH101" /></div>
                <div>
                  <Label>Department</Label>
                  <Select value={subjectForm.department_id} onValueChange={(v) => setSubjectForm({ ...subjectForm, department_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" className="gap-1" onClick={addSubject} disabled={saving}><Plus size={14} /> Add Subject</Button>
              <p className="text-xs text-muted-foreground">Only subjects belonging to this institution are shown. Existing shared subjects stay available in the attendance module.</p>

              <Table>
                <TableHeader>
                  <TableRow><TableHead>Subject</TableHead><TableHead>Code</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.code || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{departments.find((d) => d.id === s.department_id)?.name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSubject(s.id)}><Trash2 size={13} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subjects.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No institution subjects yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionAcademicsDialog;
