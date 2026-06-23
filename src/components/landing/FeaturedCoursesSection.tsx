import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
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
    <section id="featured-courses" className="relative py-24">
      <div className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-steel/5 blur-[150px]" />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
            <Sparkles size={12} /> Academy
          </span>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Featured Instruvex <span className="text-gradient">Academy Courses</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Industry-recognized certification courses in AI, Data Science, Web Development, and GATE preparation —
            with hands-on projects and verifiable certificates.
          </p>
        </motion.div>

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

        <div className="mt-10 text-center">
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