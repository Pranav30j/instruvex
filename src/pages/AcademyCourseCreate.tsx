import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send } from "lucide-react";
import FileUploadField from "@/components/academy/FileUploadField";

export default function AcademyCourseCreate() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    instructor_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "",
    thumbnail_url: "",
    category: "",
    difficulty: "beginner",
    duration_estimate: "",
    price: "",
    course_type: "recorded",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const createCourse = useMutation({
    mutationFn: async (publish: boolean) => {
      if (!form.title.trim()) throw new Error("Course title is required");
      if (!form.instructor_name.trim()) throw new Error("Instructor name is required");

      const { error } = await supabase.from("academy_courses").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        instructor_name: form.instructor_name.trim(),
        thumbnail_url: form.thumbnail_url.trim() || null,
        category: form.category.trim() || null,
        difficulty: form.difficulty,
        duration_estimate: form.duration_estimate.trim() || null,
        price: parseFloat(form.price) || 0,
        is_published: publish,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, publish) => {
      toast({
        title: publish ? "Course published!" : "Draft saved!",
        description: publish
          ? "Your course is now live in the academy."
          : "You can continue editing from the manage page.",
      });
      navigate("/dashboard/academy/manage");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Create New Course</h1>
            <p className="text-sm text-muted-foreground">Fill in the details to create a new academy course</p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Course Title *</Label>
              <Input
                placeholder="e.g. Introduction to Machine Learning"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What will students learn in this course?"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Instructor Name *</Label>
                <Input
                  placeholder="Your name"
                  value={form.instructor_name}
                  onChange={(e) => update("instructor_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Data Science, Web Dev"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select value={form.difficulty} onValueChange={(v) => update("difficulty", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course Type</Label>
                <Select value={form.course_type} onValueChange={(v) => update("course_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recorded">Recorded</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estimated Duration</Label>
                <Input
                  placeholder="e.g. 8 hours, 4 weeks"
                  value={form.duration_estimate}
                  onChange={(e) => update("duration_estimate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0 for free"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <FileUploadField
                value={form.thumbnail_url}
                onChange={(url) => update("thumbnail_url", url)}
                accept="image/*"
                folder="thumbnails"
                placeholder="Paste image URL or upload"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={createCourse.isPending}
            onClick={() => createCourse.mutate(false)}
          >
            <Save className="mr-1.5 h-4 w-4" /> Save as Draft
          </Button>
          <Button
            disabled={createCourse.isPending}
            onClick={() => createCourse.mutate(true)}
          >
            <Send className="mr-1.5 h-4 w-4" /> Publish Course
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
