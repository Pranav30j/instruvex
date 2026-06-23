import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  BookOpen, Clock, GraduationCap, Play, CheckCircle2, Lock, ArrowLeft, BarChart3, Star, Users,
} from "lucide-react";
import { formatINR } from "@/lib/currency";

const difficultyColor: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400",
  intermediate: "bg-amber-500/20 text-amber-400",
  advanced: "bg-rose-500/20 text-rose-400",
};

export default function PublicCourseDetail() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ["public-course", slugOrId],
    enabled: !!slugOrId,
    queryFn: async () => {
      // Try slug first, then id
      let { data } = await supabase
        .from("academy_courses")
        .select("*")
        .eq("slug", slugOrId!)
        .eq("is_published", true)
        .maybeSingle();
      if (!data) {
        const res = await supabase
          .from("academy_courses")
          .select("*")
          .eq("id", slugOrId!)
          .eq("is_published", true)
          .maybeSingle();
        data = res.data;
      }
      return data;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["public-course-modules", course?.id],
    enabled: !!course,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_modules")
        .select("*, academy_lectures(id,title,is_preview,duration_minutes,order_index)")
        .eq("course_id", course!.id)
        .order("order_index");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollmentCount } = useQuery({
    queryKey: ["public-course-enrollments", course?.id],
    enabled: !!course,
    queryFn: async () => {
      const { count } = await supabase
        .from("academy_enrollments")
        .select("user_id", { count: "exact", head: true })
        .eq("course_id", course!.id);
      return count || 0;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!course) return <Navigate to="/academy" replace />;

  const totalLectures = modules.reduce((s: number, m: any) => s + (m.academy_lectures?.length || 0), 0);
  const url = `/academy/course/${course.slug || course.id}`;
  const handleEnroll = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/dashboard/academy/course/${course.id}`)}`);
      return;
    }
    navigate(`/dashboard/academy/course/${course.id}`);
  };

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.meta_description || course.description || course.title,
    provider: {
      "@type": "Organization",
      name: "Instruvex Academy",
      sameAs: "https://instruvex.in",
    },
    instructor: {
      "@type": "Person",
      name: course.instructor_name,
    },
    educationalLevel: course.difficulty,
    timeRequired: course.duration_estimate || undefined,
    offers: {
      "@type": "Offer",
      price: course.price || 0,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://instruvex.in${url}`,
      category: course.price > 0 ? "Paid" : "Free",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: course.duration_estimate || "PT10H",
    },
    ...(course.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: course.rating,
        ratingCount: Math.max(enrollmentCount || 1, 1),
      },
    }),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${course.title} — Instruvex Academy`}
        description={
          course.meta_description ||
          (course.description ? course.description.slice(0, 160) : `Learn ${course.title} with Instruvex Academy. Online certification course.`)
        }
        path={url}
        image={course.thumbnail_url || undefined}
        type="product"
        jsonLd={courseJsonLd}
      />
      <Navbar />
      <main className="container mx-auto px-4 pb-16 pt-24">
        <Button variant="ghost" size="sm" onClick={() => navigate("/academy")} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to Academy
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={difficultyColor[course.difficulty] || ""}>
                {course.difficulty}
              </Badge>
              {course.category && <Badge variant="outline">{course.category}</Badge>}
              {course.price === 0 && <Badge className="bg-emerald-600 text-white">Free</Badge>}
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground lg:text-4xl">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground">{course.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><GraduationCap size={14} /> {course.instructor_name}</span>
              {course.duration_estimate && <span className="flex items-center gap-1"><Clock size={14} /> {course.duration_estimate}</span>}
              <span className="flex items-center gap-1"><BookOpen size={14} /> {totalLectures} lectures</span>
              <span className="flex items-center gap-1"><BarChart3 size={14} /> {modules.length} modules</span>
              {!!enrollmentCount && <span className="flex items-center gap-1"><Users size={14} /> {enrollmentCount.toLocaleString("en-IN")} enrolled</span>}
              {course.rating && <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {Number(course.rating).toFixed(1)}</span>}
            </div>

            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm">What you'll learn</CardTitle></CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {course.learning_outcomes.map((o: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-lg">Course Curriculum</CardTitle></CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {modules.map((mod: any, idx: number) => {
                    const lectures = mod.academy_lectures || [];
                    return (
                      <AccordionItem key={mod.id} value={mod.id} className="rounded-lg border border-border px-4">
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{mod.title}</p>
                              <p className="text-xs text-muted-foreground">{lectures.length} lectures</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-1 pb-3">
                          {lectures
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                            .map((lec: any) => (
                              <div key={lec.id} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
                                {lec.is_preview ? <Play size={14} className="text-primary" /> : <Lock size={14} className="text-muted-foreground" />}
                                <span className={lec.is_preview ? "text-foreground" : "text-muted-foreground"}>{lec.title}</span>
                                {lec.duration_minutes ? (
                                  <span className="ml-auto text-xs text-muted-foreground">{lec.duration_minutes} min</span>
                                ) : null}
                              </div>
                            ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {course.thumbnail_url && (
              <div className="overflow-hidden rounded-lg border border-border">
                <img src={course.thumbnail_url} alt={course.title} loading="lazy" className="w-full object-cover" />
              </div>
            )}
            <Card className="border-border bg-card">
              <CardContent className="space-y-3 p-5">
                {course.price > 0 ? (
                  <div className="flex items-baseline gap-3">
                    <p className="font-display text-3xl font-bold text-foreground">{formatINR(course.price)}</p>
                    {course.original_price && course.original_price > course.price && (
                      <p className="text-sm text-muted-foreground line-through">{formatINR(course.original_price)}</p>
                    )}
                  </div>
                ) : (
                  <p className="font-display text-3xl font-bold text-emerald-400">Free</p>
                )}
                <Button className="w-full" size="lg" onClick={handleEnroll}>
                  {course.price > 0 ? "Enroll Now" : "Start Learning Free"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Lifetime access · Certificate on completion
                </p>
                <div className="mt-2 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <p className="flex items-center justify-between"><span>Lectures</span><span className="text-foreground">{totalLectures}</span></p>
                  <p className="flex items-center justify-between"><span>Level</span><span className="capitalize text-foreground">{course.difficulty}</span></p>
                  {course.duration_estimate && <p className="flex items-center justify-between"><span>Duration</span><span className="text-foreground">{course.duration_estimate}</span></p>}
                  {course.category && (
                    <p className="flex items-center justify-between">
                      <span>Category</span>
                      <Link to={`/academy`} className="text-foreground hover:underline">{course.category}</Link>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}