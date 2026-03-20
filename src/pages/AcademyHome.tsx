import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search, BookOpen, Clock, BarChart3, Star, GraduationCap, Award,
  TrendingUp, Play, ChevronRight, Plus,
} from "lucide-react";

const difficultyColor: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400",
  intermediate: "bg-amber-500/20 text-amber-400",
  advanced: "bg-rose-500/20 text-rose-400",
};

export default function AcademyHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch published courses
  const { data: courses = [] } = useQuery({
    queryKey: ["academy-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ["academy-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("*, academy_courses(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  // Fetch progress for enrolled courses
  const { data: progressData = [] } = useQuery({
    queryKey: ["academy-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_lecture_progress")
        .select("*, academy_lectures(module_id, academy_modules(course_id))")
        .eq("user_id", user!.id)
        .eq("completed", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch total lectures per course for progress calculation
  const { data: courseLectureCounts = {} } = useQuery({
    queryKey: ["academy-lecture-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_lectures")
        .select("id, academy_modules(course_id)");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((l: any) => {
        const cid = l.academy_modules?.course_id;
        if (cid) counts[cid] = (counts[cid] || 0) + 1;
      });
      return counts;
    },
  });

  const categories = ["all", ...new Set(courses.map((c: any) => c.category).filter(Boolean))];

  const filtered = courses.filter((c: any) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const featured = courses.filter((c: any) => c.is_featured);
  const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id));

  const getCourseProgress = (courseId: string) => {
    const total = (courseLectureCounts as any)[courseId] || 0;
    if (!total) return 0;
    const completed = progressData.filter((p: any) =>
      p.academy_lectures?.academy_modules?.course_id === courseId
    ).length;
    return Math.round((completed / total) * 100);
  };

  const CourseCard = ({ course, showProgress = false }: { course: any; showProgress?: boolean }) => {
    const progress = showProgress ? getCourseProgress(course.id) : 0;
    const enrolled = enrolledCourseIds.has(course.id);

    return (
      <Card
        className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-primary/30 hover:shadow-glow"
        onClick={() => navigate(`/dashboard/academy/course/${course.id}`)}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
          {course.price > 0 && (
            <Badge className="absolute right-2 top-2 bg-primary text-primary-foreground">
              ${course.price}
            </Badge>
          )}
          {course.price === 0 && (
            <Badge className="absolute right-2 top-2 bg-emerald-600 text-white">Free</Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={difficultyColor[course.difficulty] || ""}>
              {course.difficulty}
            </Badge>
            {course.category && (
              <Badge variant="outline" className="text-muted-foreground">{course.category}</Badge>
            )}
          </div>
          <h3 className="mb-1 font-display text-sm font-semibold text-foreground line-clamp-2">
            {course.title}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{course.description}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GraduationCap size={12} /> {course.instructor_name}
            </span>
            {course.duration_estimate && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {course.duration_estimate}
              </span>
            )}
          </div>
          {showProgress && enrolled && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
          {!enrolled && (
            <Button size="sm" className="mt-3 w-full" variant={course.price > 0 ? "default" : "secondary"}>
              {course.price > 0 ? `Enroll – $${course.price}` : "Enroll Free"}
            </Button>
          )}
          {enrolled && !showProgress && (
            <Button size="sm" variant="secondary" className="mt-3 w-full">
              <Play size={14} className="mr-1" /> Continue Learning
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Instruvex Academy</h1>
            <p className="text-sm text-muted-foreground">Master new skills with expert-led courses and certifications</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {canManage && (
              <>
                <Button size="sm" onClick={() => navigate("/dashboard/academy/create")}>
                  <Plus size={16} className="mr-1" /> Add Course
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/academy/manage")}>
                  Manage
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue={user ? "my-courses" : "browse"}>
          <TabsList className="bg-muted">
            {user && <TabsTrigger value="my-courses">My Courses</TabsTrigger>}
            <TabsTrigger value="browse">Browse All</TabsTrigger>
            {user && <TabsTrigger value="certificates">Certificates</TabsTrigger>}
          </TabsList>

          {/* My Courses */}
          {user && (
            <TabsContent value="my-courses" className="space-y-6">
              {enrollments.length === 0 ? (
                <Card className="border-dashed border-border bg-card p-12 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">No courses yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Browse our catalog and enroll in your first course</p>
                  <Button variant="default" onClick={() => {
                    const el = document.querySelector('[data-value="browse"]') as HTMLElement;
                    el?.click();
                  }}>Browse Courses</Button>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {enrollments.map((e: any) => (
                    <CourseCard key={e.id} course={e.academy_courses} showProgress />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Browse All */}
          <TabsContent value="browse" className="space-y-6">
            {/* Featured */}
            {featured.length > 0 && !search && categoryFilter === "all" && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                  <Star className="h-5 w-5 text-amber-400" /> Featured Courses
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.slice(0, 3).map((c: any) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat as string}
                  size="sm"
                  variant={categoryFilter === cat ? "default" : "outline"}
                  onClick={() => setCategoryFilter(cat as string)}
                  className="capitalize"
                >
                  {cat as string}
                </Button>
              ))}
            </div>

            {/* Course grid */}
            {filtered.length === 0 ? (
              <Card className="border-dashed border-border bg-card p-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="font-display text-lg font-semibold text-foreground">No courses found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((c: any) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Certificates */}
          {user && (
            <TabsContent value="certificates">
              <CertificatesTab userId={user.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function CertificatesTab({ userId }: { userId: string }) {
  const { data: certs = [] } = useQuery({
    queryKey: ["academy-certificates", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_certificates")
        .select("*, academy_courses(title, instructor_name)")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (certs.length === 0) {
    return (
      <Card className="border-dashed border-border bg-card p-12 text-center">
        <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="mb-2 font-display text-lg font-semibold text-foreground">No certificates yet</h3>
        <p className="text-sm text-muted-foreground">Complete a course to earn your first certificate</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certs.map((cert: any) => (
        <Card key={cert.id} className="border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 font-display text-sm font-semibold text-foreground">
            {cert.academy_courses?.title}
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Instructor: {cert.academy_courses?.instructor_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Certificate #{cert.certificate_number}
          </p>
          <p className="text-xs text-muted-foreground">
            Issued: {new Date(cert.issued_at).toLocaleDateString()}
          </p>
        </Card>
      ))}
    </div>
  );
}
