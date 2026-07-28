import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";
import CourseCard from "@/components/academy/CourseCard";
import {
  usePublishedCourses,
  useCourseLectureCounts,
  useCourseEnrollmentCounts,
} from "@/hooks/use-academy-courses";

const FeaturedCoursesSection = () => {
  const { data: courses = [], isLoading } = usePublishedCourses();
  const featured = courses.slice(0, 8);
  const ids = featured.map((c) => c.id);
  const { data: lectureCounts = {} } = useCourseLectureCounts(ids);
  const { data: enrollmentCounts = {} } = useCourseEnrollmentCounts();

  return (
    <section id="featured-courses" className="relative hairline-t py-24 md:py-28">
      <div className="container mx-auto px-4">
        <Reveal className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Academy</p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-foreground md:text-[2.5rem]">
              Certification courses students actually complete
            </h2>
            <p className="mt-4 text-muted-foreground">
              AI, Data Science, Web Development and GATE preparation — hands-on projects, INR pricing, and
              certificates anyone can verify.
            </p>
          </div>
          <Link to="/academy" className="nav-underline hidden shrink-0 text-sm font-medium text-steel md:inline-block">
            View all courses →
          </Link>
        </Reveal>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
            <p className="text-muted-foreground">New courses are being added. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((c) => (
              <CourseCard
                key={c.id}
                course={{
                  ...c,
                  lecture_count: lectureCounts[c.id] || 0,
                  enrolled_count: enrollmentCounts[c.id] || 0,
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-10 text-center md:hidden">
          <Link to="/academy">
            <Button variant="hero" size="lg" className="gap-2">
              Browse All Courses <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCoursesSection;