import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import CourseCard from "@/components/academy/CourseCard";
import {
  usePublishedCourses,
  useCourseLectureCounts,
  useCourseEnrollmentCounts,
} from "@/hooks/use-academy-courses";
import { ACADEMY_CATEGORIES } from "@/lib/academy-categories";

const PRICE_FILTERS = [
  { value: "all", label: "All prices" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "under-500", label: "Under ₹500" },
  { value: "500-2000", label: "₹500 – ₹2,000" },
  { value: "2000+", label: "Above ₹2,000" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "latest", label: "Latest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"];

export default function AcademyCatalog() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const category = params.get("category") || "all";
  const priceFilter = params.get("price") || "all";
  const difficulty = params.get("level") || "all";
  const sort = params.get("sort") || "popular";
  const [searchInput, setSearchInput] = useState(search);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || value === "") next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  const { data: courses = [], isLoading } = usePublishedCourses();
  const ids = courses.map((c) => c.id);
  const { data: lectureCounts = {} } = useCourseLectureCounts(ids);
  const { data: enrollmentCounts = {} } = useCourseEnrollmentCounts();

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => c.category && set.add(c.category));
    return Array.from(set).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    let list = [...courses];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        c.title.toLowerCase().includes(s) || (c.description || "").toLowerCase().includes(s),
      );
    }
    if (category !== "all") list = list.filter((c) => c.category === category);
    if (difficulty !== "all") list = list.filter((c) => c.difficulty === difficulty);
    if (priceFilter === "free") list = list.filter((c) => !c.price || c.price === 0);
    else if (priceFilter === "paid") list = list.filter((c) => c.price > 0);
    else if (priceFilter === "under-500") list = list.filter((c) => c.price > 0 && c.price < 500);
    else if (priceFilter === "500-2000") list = list.filter((c) => c.price >= 500 && c.price <= 2000);
    else if (priceFilter === "2000+") list = list.filter((c) => c.price > 2000);

    if (sort === "latest") list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => (enrollmentCounts[b.id] || 0) - (enrollmentCounts[a.id] || 0));
    return list;
  }, [courses, search, category, difficulty, priceFilter, sort, enrollmentCounts]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Online Courses in India — Instruvex Academy"
        description="Browse certification courses in AI, Data Science, Web Development, Programming, and GATE preparation. Learn from expert instructors and earn verifiable certificates."
        path="/academy"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: filtered.slice(0, 20).map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://instruvex.in/academy/course/${c.slug || c.id}`,
            name: c.title,
          })),
        }}
      />
      <Navbar />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mb-8 text-center">
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-5xl">
            Learn with <span className="text-gradient">Instruvex Academy</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Certification courses for students and professionals in India — AI, Data Science, Web Development, Programming, and GATE.
          </p>
        </div>

        {/* Category quick links */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {ACADEMY_CATEGORIES.map((c) => (
            <a key={c.slug} href={`/academy/${c.slug}`}>
              <Badge variant="outline" className="cursor-pointer px-3 py-1 text-xs hover:border-primary/50">
                {c.label}
              </Badge>
            </a>
          ))}
        </div>

        {/* Filter bar */}
        <div className="mb-8 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("search", searchInput);
            }}
            className="relative md:col-span-2"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </form>
          <Select value={category} onValueChange={(v) => setParam("category", v)}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={(v) => setParam("level", v)}>
            <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d === "all" ? "All levels" : d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={(v) => setParam("price", v)}>
            <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
            <SelectContent>
              {PRICE_FILTERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "course" : "courses"}`}
          </p>
          <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="mb-3 text-muted-foreground">No courses match your filters.</p>
            <Button variant="outline" onClick={() => setParams({})}>Clear filters</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
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
      </main>
      <Footer />
    </div>
  );
}