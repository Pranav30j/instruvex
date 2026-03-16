import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import QuizTaker from "@/components/academy/QuizTaker";
import {
  BookOpen, Clock, GraduationCap, Play, CheckCircle2, FileText,
  Download, Lock, ArrowLeft, BarChart3, HelpCircle, Award, Trophy,
} from "lucide-react";

const difficultyColor: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400",
  intermediate: "bg-amber-500/20 text-amber-400",
  advanced: "bg-rose-500/20 text-rose-400",
};

export default function AcademyCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["academy-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["academy-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_modules")
        .select("*, academy_lectures(*), academy_notes(*), academy_quizzes(*)")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["academy-enrollment", courseId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("course_id", courseId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ["academy-progress-course", courseId, user?.id],
    enabled: !!user && !!enrollment,
    queryFn: async () => {
      const lectureIds = modules.flatMap((m: any) =>
        (m.academy_lectures || []).map((l: any) => l.id)
      );
      if (lectureIds.length === 0) return [];
      const { data, error } = await supabase
        .from("academy_lecture_progress")
        .select("*")
        .eq("user_id", user!.id)
        .in("lecture_id", lectureIds);
      if (error) throw error;
      return data;
    },
  });

  const { data: certificate } = useQuery({
    queryKey: ["academy-certificate", courseId, user?.id],
    enabled: !!user && !!enrollment,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_certificates")
        .select("*")
        .eq("user_id", user!.id)
        .eq("course_id", courseId!)
        .maybeSingle();
      return data;
    },
  });

  const completedLectureIds = new Set(
    progressData.filter((p: any) => p.completed).map((p: any) => p.lecture_id)
  );

  const totalLectures = modules.reduce(
    (sum: number, m: any) => sum + (m.academy_lectures?.length || 0), 0
  );
  const progressPercent = totalLectures
    ? Math.round((completedLectureIds.size / totalLectures) * 100)
    : 0;

  const handleQuizComplete = async (passed: boolean, quizId: string, isFinalExam: boolean) => {
    if (passed && isFinalExam && !certificate) {
      // Issue certificate
      const certNumber = `INSTRUVEX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { error } = await supabase.from("academy_certificates").insert({
        user_id: user!.id,
        course_id: courseId!,
        certificate_number: certNumber,
      });
      if (!error) {
        toast({ title: "🎉 Certificate Earned!", description: `Certificate ID: ${certNumber}` });
        queryClient.invalidateQueries({ queryKey: ["academy-certificate"] });
      }
    }
    setActiveQuizId(null);
  };

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate("/login");
        return;
      }
      if (course.price > 0) {
        toast({ title: "Payment Required", description: "Paid course enrollment coming soon. For now, free courses are available." });
        return;
      }
      const { error } = await supabase.from("academy_enrollments").insert({
        user_id: user.id,
        course_id: courseId!,
        payment_status: "free",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Enrolled!", description: "You've been enrolled in this course." });
      queryClient.invalidateQueries({ queryKey: ["academy-enrollment"] });
      queryClient.invalidateQueries({ queryKey: ["academy-enrollments"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleLectureMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      const isCompleted = completedLectureIds.has(lectureId);
      if (isCompleted) {
        await supabase
          .from("academy_lecture_progress")
          .delete()
          .eq("user_id", user!.id)
          .eq("lecture_id", lectureId);
      } else {
        await supabase.from("academy_lecture_progress").upsert({
          user_id: user!.id,
          lecture_id: lectureId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,lecture_id" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-progress"] });
      queryClient.invalidateQueries({ queryKey: ["academy-progress-course"] });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="font-display text-xl text-foreground">Course not found</h2>
          <Button variant="link" onClick={() => navigate("/dashboard/academy")}>Back to Academy</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isEnrolled = !!enrollment;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/academy")}>
          <ArrowLeft size={16} className="mr-1" /> Back to Academy
        </Button>

        {/* Course header */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={difficultyColor[course.difficulty] || ""}>
                {course.difficulty}
              </Badge>
              {course.category && <Badge variant="outline">{course.category}</Badge>}
              {course.price === 0 && <Badge className="bg-emerald-600 text-white">Free</Badge>}
            </div>

            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">{course.title}</h1>
            <p className="text-sm text-muted-foreground">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><GraduationCap size={14} /> {course.instructor_name}</span>
              {course.duration_estimate && <span className="flex items-center gap-1"><Clock size={14} /> {course.duration_estimate}</span>}
              <span className="flex items-center gap-1"><BookOpen size={14} /> {totalLectures} lectures</span>
              <span className="flex items-center gap-1"><BarChart3 size={14} /> {modules.length} modules</span>
            </div>

            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">What you'll learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {course.learning_outcomes.map((outcome: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {course.thumbnail_url && (
              <div className="overflow-hidden rounded-lg">
                <img src={course.thumbnail_url} alt={course.title} className="w-full object-cover" />
              </div>
            )}

            {isEnrolled ? (
              <Card className="border-primary/20 bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {completedLectureIds.size} of {totalLectures} lectures completed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  {course.price > 0 && (
                    <p className="text-center font-display text-2xl font-bold text-foreground">${course.price}</p>
                  )}
                  <Button className="w-full" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                    {course.price > 0 ? `Enroll – $${course.price}` : "Enroll Free"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Video player */}
        {activeLecture?.video_url && isEnrolled && (
          <Card className="border-border bg-card overflow-hidden">
            <div className="aspect-video bg-black">
              <iframe
                src={activeLecture.video_url}
                title={activeLecture.title}
                className="h-full w-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-display text-lg font-semibold text-foreground">{activeLecture.title}</h3>
              {activeLecture.description && (
                <p className="mt-1 text-sm text-muted-foreground">{activeLecture.description}</p>
              )}
              <Button
                size="sm"
                variant={completedLectureIds.has(activeLecture.id) ? "secondary" : "default"}
                className="mt-3"
                onClick={() => toggleLectureMutation.mutate(activeLecture.id)}
              >
                <CheckCircle2 size={14} className="mr-1" />
                {completedLectureIds.has(activeLecture.id) ? "Completed" : "Mark as Complete"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Quiz */}
        {activeQuizId && isEnrolled && (
          <div>
            <Button variant="ghost" size="sm" className="mb-2" onClick={() => setActiveQuizId(null)}>
              <ArrowLeft size={14} className="mr-1" /> Back to Curriculum
            </Button>
            <QuizTaker
              quizId={activeQuizId}
              onComplete={(passed) => {
                const quiz = modules
                  .flatMap((m: any) => m.academy_quizzes || [])
                  .find((q: any) => q.id === activeQuizId);
                handleQuizComplete(passed, activeQuizId, quiz?.is_final_exam || false);
              }}
            />
          </div>
        )}

        {/* Certificate */}
        {certificate && (
          <Card className="border-emerald-500/20 bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <Trophy className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Certificate Earned!</h3>
                <p className="text-xs text-muted-foreground">ID: {certificate.certificate_number}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate.certificate_number}`);
                  toast({ title: "Link copied!" });
                }}>
                  Share
                </Button>
                <Button size="sm" onClick={() => window.open(`/verify/${certificate.certificate_number}`, "_blank")}>
                  <Award size={14} className="mr-1" /> View
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Curriculum */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Course Curriculum</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {modules.map((mod: any, idx: number) => {
                const lectures = mod.academy_lectures || [];
                const notes = mod.academy_notes || [];
                const quizzes = mod.academy_quizzes || [];
                const modCompleted = lectures.filter((l: any) => completedLectureIds.has(l.id)).length;

                return (
                  <AccordionItem key={mod.id} value={mod.id} className="rounded-lg border border-border px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{mod.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {lectures.length} lectures {notes.length > 0 && `· ${notes.length} notes`}
                            {quizzes.length > 0 && ` · ${quizzes.length} quiz${quizzes.length > 1 ? "zes" : ""}`}
                            {isEnrolled && ` · ${modCompleted}/${lectures.length} done`}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 pb-3">
                      {lectures
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((lecture: any) => {
                          const completed = completedLectureIds.has(lecture.id);
                          const canPlay = isEnrolled || lecture.is_preview;

                          return (
                            <button
                              key={lecture.id}
                              onClick={() => { canPlay && setActiveLecture(lecture); setActiveQuizId(null); }}
                              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                activeLecture?.id === lecture.id
                                  ? "bg-primary/10 text-primary"
                                  : canPlay
                                  ? "text-foreground hover:bg-muted"
                                  : "cursor-not-allowed text-muted-foreground"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                              ) : canPlay ? (
                                <Play size={14} className="shrink-0" />
                              ) : (
                                <Lock size={14} className="shrink-0" />
                              )}
                              <span className="flex-1">{lecture.title}</span>
                              {lecture.is_preview && !isEnrolled && (
                                <Badge variant="outline" className="text-xs">Preview</Badge>
                              )}
                              {lecture.duration_minutes > 0 && (
                                <span className="text-xs text-muted-foreground">{lecture.duration_minutes}m</span>
                              )}
                            </button>
                          );
                        })}
                      {notes.map((note: any) => (
                        <div key={note.id} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
                          <FileText size={14} className="shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-foreground">{note.title}</span>
                          {isEnrolled && (
                            <a
                              href={note.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline"
                            >
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      ))}
                      {/* Quizzes */}
                      {quizzes.map((quiz: any) => (
                        <button
                          key={quiz.id}
                          onClick={() => { if (isEnrolled) { setActiveQuizId(quiz.id); setActiveLecture(null); } }}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            activeQuizId === quiz.id
                              ? "bg-primary/10 text-primary"
                              : isEnrolled
                              ? "text-foreground hover:bg-muted"
                              : "cursor-not-allowed text-muted-foreground"
                          }`}
                        >
                          {quiz.is_final_exam ? (
                            <GraduationCap size={14} className="shrink-0 text-amber-400" />
                          ) : (
                            <HelpCircle size={14} className="shrink-0 text-primary" />
                          )}
                          <span className="flex-1">{quiz.title}</span>
                          {quiz.is_final_exam && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400">Final Exam</Badge>
                          )}
                          {!isEnrolled && <Lock size={14} className="shrink-0 text-muted-foreground" />}
                        </button>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
