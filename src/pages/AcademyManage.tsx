import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import {
  Plus, BookOpen, Pencil, Trash2, GripVertical, Video, FileText,
  Eye, EyeOff, Star, Upload, HelpCircle,
} from "lucide-react";
import QuizManager from "@/components/academy/QuizManager";
import FileUploadField from "@/components/academy/FileUploadField";

export default function AcademyManage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lectureDialogOpen, setLectureDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", category: "", instructor_name: "",
    price: "0", difficulty: "beginner", duration_estimate: "",
    learning_outcomes: "", thumbnail_url: "",
  });
  const [moduleForm, setModuleForm] = useState({ title: "" });
  const [lectureForm, setLectureForm] = useState({
    title: "", video_url: "", description: "", duration_minutes: "0", is_preview: false,
  });
  const [noteForm, setNoteForm] = useState({ title: "", file_url: "" });

  const isAdmin = hasRole("super_admin") || hasRole("instructor") || hasRole("institute_admin");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["academy-manage-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (hasRole("super_admin")) {
        const { data, error } = await supabase.from("academy_courses").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("academy_courses").select("*").eq("created_by", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allModules = [] } = useQuery({
    queryKey: ["academy-manage-modules", selectedCourseId],
    enabled: !!selectedCourseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_modules")
        .select("*, academy_lectures(*), academy_notes(*)")
        .eq("course_id", selectedCourseId!)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  // Course CRUD
  const saveCourse = useMutation({
    mutationFn: async () => {
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category || null,
        instructor_name: courseForm.instructor_name,
        price: parseFloat(courseForm.price) || 0,
        difficulty: courseForm.difficulty,
        duration_estimate: courseForm.duration_estimate || null,
        learning_outcomes: courseForm.learning_outcomes
          ? courseForm.learning_outcomes.split("\n").filter(Boolean)
          : [],
        created_by: user!.id,
      };
      if (editingCourse) {
        const { error } = await supabase.from("academy_courses").update(payload).eq("id", editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_courses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingCourse ? "Course updated" : "Course created" });
      queryClient.invalidateQueries({ queryKey: ["academy-manage-courses"] });
      setCourseDialogOpen(false);
      resetCourseForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("academy_courses").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academy-manage-courses"] }),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("academy_courses").update({ is_featured: featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academy-manage-courses"] }),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Course deleted" });
      queryClient.invalidateQueries({ queryKey: ["academy-manage-courses"] });
      setSelectedCourseId(null);
    },
  });

  // Module CRUD
  const saveModule = useMutation({
    mutationFn: async () => {
      const maxOrder = allModules.length;
      const { error } = await supabase.from("academy_modules").insert({
        course_id: selectedCourseId!,
        title: moduleForm.title,
        order_index: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Module added" });
      queryClient.invalidateQueries({ queryKey: ["academy-manage-modules"] });
      setModuleDialogOpen(false);
      setModuleForm({ title: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-manage-modules"] });
      toast({ title: "Module deleted" });
    },
  });

  // Lecture CRUD
  const saveLecture = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_lectures").insert({
        module_id: selectedModuleId!,
        title: lectureForm.title,
        video_url: lectureForm.video_url || null,
        description: lectureForm.description || null,
        duration_minutes: parseInt(lectureForm.duration_minutes) || 0,
        is_preview: lectureForm.is_preview,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Lecture added" });
      queryClient.invalidateQueries({ queryKey: ["academy-manage-modules"] });
      setLectureDialogOpen(false);
      setLectureForm({ title: "", video_url: "", description: "", duration_minutes: "0", is_preview: false });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteLecture = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_lectures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academy-manage-modules"] }),
  });

  // Note CRUD
  const saveNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_notes").insert({
        module_id: selectedModuleId!,
        title: noteForm.title,
        file_url: noteForm.file_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Note added" });
      queryClient.invalidateQueries({ queryKey: ["academy-manage-modules"] });
      setNoteDialogOpen(false);
      setNoteForm({ title: "", file_url: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academy-manage-modules"] }),
  });

  const resetCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({
      title: "", description: "", category: "", instructor_name: "",
      price: "0", difficulty: "beginner", duration_estimate: "",
      learning_outcomes: "",
    });
  };

  const openEditCourse = (c: any) => {
    setEditingCourse(c);
    setCourseForm({
      title: c.title,
      description: c.description || "",
      category: c.category || "",
      instructor_name: c.instructor_name,
      price: String(c.price),
      difficulty: c.difficulty,
      duration_estimate: c.duration_estimate || "",
      learning_outcomes: (c.learning_outcomes || []).join("\n"),
    });
    setCourseDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-display text-xl text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only instructors and admins can manage courses.</p>
        </div>
      </DashboardLayout>
    );
  }

  const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Course Management</h1>
            <p className="text-sm text-muted-foreground">Create and manage academy courses</p>
          </div>
          <Dialog open={courseDialogOpen} onOpenChange={(o) => { setCourseDialogOpen(o); if (!o) resetCourseForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-1" /> New Course</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Create Course"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Instructor Name *</Label>
                    <Input value={courseForm.instructor_name} onChange={(e) => setCourseForm({ ...courseForm, instructor_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input placeholder="e.g. AI, Web Dev" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Price ($)</Label>
                    <Input type="number" min="0" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} />
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select value={courseForm.difficulty} onValueChange={(v) => setCourseForm({ ...courseForm, difficulty: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Input placeholder="e.g. 8 hours" value={courseForm.duration_estimate} onChange={(e) => setCourseForm({ ...courseForm, duration_estimate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Learning Outcomes (one per line)</Label>
                  <Textarea value={courseForm.learning_outcomes} onChange={(e) => setCourseForm({ ...courseForm, learning_outcomes: e.target.value })} rows={4} placeholder="Understand core concepts of ML&#10;Build a neural network from scratch" />
                </div>
                <Button onClick={() => saveCourse.mutate()} disabled={!courseForm.title || !courseForm.instructor_name || saveCourse.isPending} className="w-full">
                  {editingCourse ? "Update Course" : "Create Course"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Course list */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-sm font-medium text-muted-foreground">Your Courses ({courses.length})</h3>
            {courses.map((c: any) => (
              <Card
                key={c.id}
                className={`cursor-pointer border-border bg-card transition-all hover:border-primary/30 ${selectedCourseId === c.id ? "border-primary/50 shadow-glow" : ""}`}
                onClick={() => setSelectedCourseId(c.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-foreground">{c.title}</h4>
                      <p className="text-xs text-muted-foreground">{c.instructor_name}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {c.is_published ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 text-xs">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {courses.length === 0 && !isLoading && (
              <Card className="border-dashed border-border bg-card p-8 text-center">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No courses yet</p>
              </Card>
            )}
          </div>

          {/* Course detail / modules */}
          <div className="lg:col-span-2">
            {selectedCourse ? (
              <div className="space-y-4">
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-lg font-bold text-foreground">{selectedCourse.title}</h2>
                        <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditCourse(selectedCourse)}>
                          <Pencil size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleFeatured.mutate({ id: selectedCourse.id, featured: !selectedCourse.is_featured })}>
                          <Star size={14} className={selectedCourse.is_featured ? "fill-amber-400 text-amber-400" : ""} />
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedCourse.is_published ? "secondary" : "default"}
                          onClick={() => togglePublish.mutate({ id: selectedCourse.id, published: !selectedCourse.is_published })}
                        >
                          {selectedCourse.is_published ? <><EyeOff size={14} className="mr-1" /> Unpublish</> : <><Eye size={14} className="mr-1" /> Publish</>}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this course?")) deleteCourse.mutate(selectedCourse.id); }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modules */}
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-foreground">Modules</h3>
                  <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus size={14} className="mr-1" /> Add Module</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Module</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Module Title *</Label><Input value={moduleForm.title} onChange={(e) => setModuleForm({ title: e.target.value })} /></div>
                        <Button onClick={() => saveModule.mutate()} disabled={!moduleForm.title || saveModule.isPending} className="w-full">Add Module</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Accordion type="multiple" className="space-y-2">
                  {allModules.map((mod: any, idx: number) => (
                    <AccordionItem key={mod.id} value={mod.id} className="rounded-lg border border-border px-4">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">{idx + 1}</span>
                          <span className="text-sm font-medium text-foreground">{mod.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {mod.academy_lectures?.length || 0} lectures · {mod.academy_notes?.length || 0} notes
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 pb-3">
                        {/* Lectures */}
                        {(mod.academy_lectures || [])
                          .sort((a: any, b: any) => a.order_index - b.order_index)
                          .map((l: any) => (
                            <div key={l.id} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Video size={14} className="text-primary" />
                                <span className="text-foreground">{l.title}</span>
                                {l.is_preview && <Badge variant="outline" className="text-xs">Preview</Badge>}
                                {l.duration_minutes > 0 && <span className="text-xs text-muted-foreground">{l.duration_minutes}m</span>}
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => deleteLecture.mutate(l.id)}><Trash2 size={12} /></Button>
                            </div>
                          ))}
                        {/* Notes */}
                        {(mod.academy_notes || []).map((n: any) => (
                          <div key={n.id} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2 text-sm">
                              <FileText size={14} className="text-amber-400" />
                              <span className="text-foreground">{n.title}</span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => deleteNote.mutate(n.id)}><Trash2 size={12} /></Button>
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1">
                          <Dialog open={lectureDialogOpen} onOpenChange={setLectureDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedModuleId(mod.id)}>
                                <Video size={12} className="mr-1" /> Add Lecture
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Add Lecture</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div><Label>Title *</Label><Input value={lectureForm.title} onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })} /></div>
                                <div><Label>Video URL</Label><Input placeholder="YouTube/Vimeo embed URL" value={lectureForm.video_url} onChange={(e) => setLectureForm({ ...lectureForm, video_url: e.target.value })} /></div>
                                <div><Label>Description</Label><Textarea value={lectureForm.description} onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })} rows={2} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div><Label>Duration (min)</Label><Input type="number" value={lectureForm.duration_minutes} onChange={(e) => setLectureForm({ ...lectureForm, duration_minutes: e.target.value })} /></div>
                                  <div className="flex items-center gap-2 pt-6">
                                    <Switch checked={lectureForm.is_preview} onCheckedChange={(v) => setLectureForm({ ...lectureForm, is_preview: v })} />
                                    <Label>Free Preview</Label>
                                  </div>
                                </div>
                                <Button onClick={() => saveLecture.mutate()} disabled={!lectureForm.title || saveLecture.isPending} className="w-full">Add Lecture</Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedModuleId(mod.id)}>
                                <FileText size={12} className="mr-1" /> Add Note
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div><Label>Title *</Label><Input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} /></div>
                                <div><Label>File URL *</Label><Input placeholder="PDF or document URL" value={noteForm.file_url} onChange={(e) => setNoteForm({ ...noteForm, file_url: e.target.value })} /></div>
                                <Button onClick={() => saveNote.mutate()} disabled={!noteForm.title || !noteForm.file_url || saveNote.isPending} className="w-full">Add Note</Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => { if (confirm("Delete this module and all its content?")) deleteModule.mutate(mod.id); }}>
                            <Trash2 size={12} className="mr-1" /> Delete Module
                          </Button>
                        </div>

                        {/* Quiz Manager */}
                        <div className="mt-3 border-t border-border pt-3">
                          <QuizManager moduleId={mod.id} moduleName={mod.title} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {allModules.length === 0 && (
                  <Card className="border-dashed border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">No modules yet. Add your first module to start building the curriculum.</p>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-dashed border-border bg-card p-12 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">Select a course</h3>
                <p className="text-sm text-muted-foreground">Choose a course from the list to manage its modules, lectures, and notes</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
