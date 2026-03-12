import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2, Plus, Search, Globe, Mail, Phone, MapPin, Layers, GraduationCap,
  Pencil, Trash2, ChevronRight,
} from "lucide-react";

interface Institute {
  id: string;
  name: string;
  code: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  created_by: string;
  created_at: string;
}

interface Department {
  id: string;
  institute_id: string;
  name: string;
  code: string | null;
  head_name: string | null;
}

interface Batch {
  id: string;
  department_id: string;
  name: string;
  year: number | null;
  is_active: boolean;
}

type FormMode = "create" | "edit";

const Institutions = () => {
  const { user, hasRole } = useAuth();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [instDialogOpen, setInstDialogOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");

  // Form states
  const [instForm, setInstForm] = useState({ id: "", name: "", code: "", email: "", phone: "", address: "", website: "" });
  const [deptForm, setDeptForm] = useState({ id: "", institute_id: "", name: "", code: "", head_name: "" });
  const [batchForm, setBatchForm] = useState({ id: "", department_id: "", name: "", year: "", is_active: true });

  const canManage = hasRole("super_admin") || hasRole("institute_admin");

  const fetchAll = async () => {
    setLoading(true);
    const [instRes, deptRes, batchRes] = await Promise.all([
      supabase.from("institutes").select("*").order("name"),
      supabase.from("departments").select("*").order("name"),
      supabase.from("batches").select("*").order("name"),
    ]);
    if (instRes.data) setInstitutes(instRes.data as Institute[]);
    if (deptRes.data) setDepartments(deptRes.data as Department[]);
    if (batchRes.data) setBatches(batchRes.data as Batch[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Institute CRUD
  const openInstCreate = () => {
    setFormMode("create");
    setInstForm({ id: "", name: "", code: "", email: "", phone: "", address: "", website: "" });
    setInstDialogOpen(true);
  };

  const openInstEdit = (inst: Institute) => {
    setFormMode("edit");
    setInstForm({ id: inst.id, name: inst.name, code: inst.code || "", email: inst.email || "", phone: inst.phone || "", address: inst.address || "", website: inst.website || "" });
    setInstDialogOpen(true);
  };

  const saveInstitute = async () => {
    if (!instForm.name.trim()) { toast.error("Name is required"); return; }
    if (formMode === "create") {
      const { error } = await supabase.from("institutes").insert({
        name: instForm.name, code: instForm.code || null, email: instForm.email || null,
        phone: instForm.phone || null, address: instForm.address || null,
        website: instForm.website || null, created_by: user!.id,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Institute created");
    } else {
      const { error } = await supabase.from("institutes").update({
        name: instForm.name, code: instForm.code || null, email: instForm.email || null,
        phone: instForm.phone || null, address: instForm.address || null,
        website: instForm.website || null,
      }).eq("id", instForm.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Institute updated");
    }
    setInstDialogOpen(false);
    fetchAll();
  };

  const deleteInstitute = async (id: string) => {
    const { error } = await supabase.from("institutes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Institute deleted");
    fetchAll();
  };

  // Department CRUD
  const openDeptCreate = (instituteId: string) => {
    setFormMode("create");
    setDeptForm({ id: "", institute_id: instituteId, name: "", code: "", head_name: "" });
    setDeptDialogOpen(true);
  };

  const openDeptEdit = (dept: Department) => {
    setFormMode("edit");
    setDeptForm({ id: dept.id, institute_id: dept.institute_id, name: dept.name, code: dept.code || "", head_name: dept.head_name || "" });
    setDeptDialogOpen(true);
  };

  const saveDepartment = async () => {
    if (!deptForm.name.trim()) { toast.error("Name is required"); return; }
    if (formMode === "create") {
      const { error } = await supabase.from("departments").insert({
        institute_id: deptForm.institute_id, name: deptForm.name,
        code: deptForm.code || null, head_name: deptForm.head_name || null,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Department created");
    } else {
      const { error } = await supabase.from("departments").update({
        name: deptForm.name, code: deptForm.code || null, head_name: deptForm.head_name || null,
      }).eq("id", deptForm.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Department updated");
    }
    setDeptDialogOpen(false);
    fetchAll();
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Department deleted");
    fetchAll();
  };

  // Batch CRUD
  const openBatchCreate = (departmentId: string) => {
    setFormMode("create");
    setBatchForm({ id: "", department_id: departmentId, name: "", year: "", is_active: true });
    setBatchDialogOpen(true);
  };

  const openBatchEdit = (batch: Batch) => {
    setFormMode("edit");
    setBatchForm({ id: batch.id, department_id: batch.department_id, name: batch.name, year: batch.year?.toString() || "", is_active: batch.is_active });
    setBatchDialogOpen(true);
  };

  const saveBatch = async () => {
    if (!batchForm.name.trim()) { toast.error("Name is required"); return; }
    if (formMode === "create") {
      const { error } = await supabase.from("batches").insert({
        department_id: batchForm.department_id, name: batchForm.name,
        year: batchForm.year ? parseInt(batchForm.year) : null,
        is_active: batchForm.is_active,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Batch created");
    } else {
      const { error } = await supabase.from("batches").update({
        name: batchForm.name, year: batchForm.year ? parseInt(batchForm.year) : null,
        is_active: batchForm.is_active,
      }).eq("id", batchForm.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Batch updated");
    }
    setBatchDialogOpen(false);
    fetchAll();
  };

  const deleteBatch = async (id: string) => {
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Batch deleted");
    fetchAll();
  };

  const filtered = institutes.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase())
  );

  const getDepartments = (instId: string) => departments.filter((d) => d.institute_id === instId);
  const getBatches = (deptId: string) => batches.filter((b) => b.department_id === deptId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Institution Management</h1>
            <p className="text-sm text-muted-foreground">Manage institutes, departments, and batches</p>
          </div>
          {canManage && (
            <Button onClick={openInstCreate} className="gap-2">
              <Plus size={16} /> Add Institute
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Institutes", value: institutes.length, icon: Building2 },
            { label: "Departments", value: departments.length, icon: Layers },
            { label: "Batches", value: batches.length, icon: GraduationCap },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Search institutes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Institute list */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Building2 size={40} className="text-muted-foreground" />
              <p className="text-muted-foreground">No institutes found</p>
              {canManage && (
                <Button variant="outline" onClick={openInstCreate} className="gap-2">
                  <Plus size={16} /> Create First Institute
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {filtered.map((inst) => (
              <AccordionItem key={inst.id} value={inst.id} className="rounded-lg border border-border bg-card px-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{inst.name}</span>
                        {inst.code && <Badge variant="secondary" className="text-xs">{inst.code}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {inst.email && <span className="flex items-center gap-1"><Mail size={12} />{inst.email}</span>}
                        {inst.phone && <span className="flex items-center gap-1"><Phone size={12} />{inst.phone}</span>}
                        {inst.website && <span className="flex items-center gap-1"><Globe size={12} />{inst.website}</span>}
                      </div>
                    </div>
                    <span className="mr-3 text-xs text-muted-foreground">{getDepartments(inst.id).length} dept(s)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border px-5 pb-5 pt-4">
                  {inst.address && (
                    <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><MapPin size={14} />{inst.address}</p>
                  )}

                  {canManage && (
                    <div className="mb-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openInstEdit(inst)} className="gap-1"><Pencil size={14} /> Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => openDeptCreate(inst.id)} className="gap-1"><Plus size={14} /> Add Department</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteInstitute(inst.id)} className="gap-1"><Trash2 size={14} /> Delete</Button>
                    </div>
                  )}

                  {/* Departments */}
                  {getDepartments(inst.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No departments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {getDepartments(inst.id).map((dept) => (
                        <Card key={dept.id} className="border-border bg-secondary/30">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers size={16} className="text-primary" />
                                <CardTitle className="text-sm font-medium">{dept.name}</CardTitle>
                                {dept.code && <Badge variant="outline" className="text-xs">{dept.code}</Badge>}
                              </div>
                              {canManage && (
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDeptEdit(dept)}><Pencil size={12} /></Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openBatchCreate(dept.id)}><Plus size={12} /></Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteDepartment(dept.id)}><Trash2 size={12} /></Button>
                                </div>
                              )}
                            </div>
                            {dept.head_name && <p className="text-xs text-muted-foreground">Head: {dept.head_name}</p>}
                          </CardHeader>
                          <CardContent className="px-4 pb-4 pt-0">
                            {getBatches(dept.id).length === 0 ? (
                              <p className="text-xs text-muted-foreground">No batches</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {getBatches(dept.id).map((batch) => (
                                  <div key={batch.id} className="group flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5">
                                    <GraduationCap size={13} className="text-muted-foreground" />
                                    <span className="text-xs font-medium text-foreground">{batch.name}</span>
                                    {batch.year && <span className="text-xs text-muted-foreground">({batch.year})</span>}
                                    <Badge variant={batch.is_active ? "default" : "secondary"} className="ml-1 h-4 px-1.5 text-[10px]">
                                      {batch.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    {canManage && (
                                      <span className="ml-1 hidden gap-0.5 group-hover:flex">
                                        <button onClick={() => openBatchEdit(batch)} className="text-muted-foreground hover:text-foreground"><Pencil size={11} /></button>
                                        <button onClick={() => deleteBatch(batch.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Institute Dialog */}
      <Dialog open={instDialogOpen} onOpenChange={setInstDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Create Institute" : "Edit Institute"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={instForm.name} onChange={(e) => setInstForm({ ...instForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={instForm.code} onChange={(e) => setInstForm({ ...instForm, code: e.target.value })} placeholder="e.g. MIT" /></div>
              <div><Label>Email</Label><Input value={instForm.email} onChange={(e) => setInstForm({ ...instForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={instForm.phone} onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })} /></div>
              <div><Label>Website</Label><Input value={instForm.website} onChange={(e) => setInstForm({ ...instForm, website: e.target.value })} /></div>
            </div>
            <div><Label>Address</Label><Input value={instForm.address} onChange={(e) => setInstForm({ ...instForm, address: e.target.value })} /></div>
            <Button onClick={saveInstitute} className="w-full">{formMode === "create" ? "Create" : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Add Department" : "Edit Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="e.g. CS" /></div>
              <div><Label>Head Name</Label><Input value={deptForm.head_name} onChange={(e) => setDeptForm({ ...deptForm, head_name: e.target.value })} /></div>
            </div>
            <Button onClick={saveDepartment} className="w-full">{formMode === "create" ? "Create" : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Add Batch" : "Edit Batch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} placeholder="e.g. Batch A" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Year</Label><Input type="number" value={batchForm.year} onChange={(e) => setBatchForm({ ...batchForm, year: e.target.value })} placeholder="2026" /></div>
              <div className="flex items-end gap-2 pb-1">
                <Label>Active</Label>
                <input type="checkbox" checked={batchForm.is_active} onChange={(e) => setBatchForm({ ...batchForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-border" />
              </div>
            </div>
            <Button onClick={saveBatch} className="w-full">{formMode === "create" ? "Create" : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Institutions;
