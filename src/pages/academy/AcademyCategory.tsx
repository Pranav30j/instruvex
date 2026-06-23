import { useMemo } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import CourseCard from "@/components/academy/CourseCard";
import {
  usePublishedCourses,
  useCourseLectureCounts,
  useCourseEnrollmentCounts,
} from "@/hooks/use-academy-courses";
import { ACADEMY_CATEGORIES, categoryMatchesCourse, findCategoryBySlug } from "@/lib/academy-categories";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function AcademyCategory() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const category = categorySlug ? findCategoryBySlug(categorySlug) : undefined;

  const { data: courses = [], isLoading } = usePublishedCourses();
  const matched = useMemo(
    () => (category ? courses.filter((c) => categoryMatchesCourse(category, c.category)) : []),
    [courses, category],
  );
  const ids = matched.map((c) => c.id);
  const { data: lectureCounts = {} } = useCourseLectureCounts(ids);
  const { data: enrollmentCounts = {} } = useCourseEnrollmentCounts();

  if (!category) return <Navigate to="/academy" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={category.title}
        description={category.description}
        path={`/academy/${category.slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: category.title,
            description: category.description,
            url: `https://instruvex.in/academy/${category.slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: matched.slice(0, 20).map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://instruvex.in/academy/course/${c.slug || c.id}`,
              name: c.title,
            })),
          },
        ]}
      />
      <Navbar />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs uppercase tracking-wider text-steel">Instruvex Academy</p>
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-5xl">
            {category.label} <span className="text-gradient">Courses</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">{category.description}</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : matched.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">
              No {category.label} courses are published yet. Explore other categories from Instruvex Academy.
            </p>
            <Link to="/academy">
              <Button variant="hero" className="gap-2">Browse all courses <ArrowRight size={16} /></Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matched.map((c) => (
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

        <div className="mt-16 border-t border-border pt-10">
          <h2 className="mb-4 text-center font-display text-xl font-semibold text-foreground">Explore other categories</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {ACADEMY_CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
              <Link key={c.slug} to={`/academy/${c.slug}`}>
                <Button variant="outline" size="sm">{c.label}</Button>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}