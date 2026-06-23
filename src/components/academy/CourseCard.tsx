import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, GraduationCap, Star, Users } from "lucide-react";
import { formatINR } from "@/lib/currency";

const difficultyColor: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400",
  intermediate: "bg-amber-500/20 text-amber-400",
  advanced: "bg-rose-500/20 text-rose-400",
};

export interface PublicCourse {
  id: string;
  slug?: string | null;
  title: string;
  description?: string | null;
  instructor_name: string;
  category?: string | null;
  difficulty: string;
  duration_estimate?: string | null;
  price: number;
  original_price?: number | null;
  rating?: number | null;
  thumbnail_url?: string | null;
  lecture_count?: number;
  enrolled_count?: number;
}

export default function CourseCard({ course }: { course: PublicCourse }) {
  const url = `/academy/course/${course.slug || course.id}`;
  const hasDiscount = !!course.original_price && course.original_price > course.price && course.price > 0;
  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / Number(course.original_price)) * 100)
    : 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border bg-card transition-all hover:border-primary/30 hover:shadow-glow">
      <Link to={url} className="block">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
          {hasDiscount && (
            <Badge className="absolute left-2 top-2 bg-rose-600 text-white">{discountPercent}% OFF</Badge>
          )}
          {course.price === 0 ? (
            <Badge className="absolute right-2 top-2 bg-emerald-600 text-white">Free</Badge>
          ) : (
            <Badge className="absolute right-2 top-2 bg-primary text-primary-foreground">
              {formatINR(course.price)}
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={difficultyColor[course.difficulty] || ""}>
            {course.difficulty}
          </Badge>
          {course.category && (
            <Badge variant="outline" className="text-muted-foreground">{course.category}</Badge>
          )}
        </div>
        <Link to={url}>
          <h3 className="mb-1 line-clamp-2 font-display text-sm font-semibold text-foreground hover:text-primary">
            {course.title}
          </h3>
        </Link>
        {course.description && (
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
        )}
        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GraduationCap size={12} /> {course.instructor_name}
            </span>
            {course.duration_estimate && (
              <span className="flex items-center gap-1"><Clock size={12} /> {course.duration_estimate}</span>
            )}
            {typeof course.lecture_count === "number" && (
              <span className="flex items-center gap-1"><BookOpen size={12} /> {course.lecture_count} lectures</span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {course.rating ? (
                <><Star size={12} className="fill-amber-400 text-amber-400" /> {Number(course.rating).toFixed(1)}</>
              ) : (
                <><Star size={12} /> New</>
              )}
            </span>
            {typeof course.enrolled_count === "number" && course.enrolled_count > 0 && (
              <span className="flex items-center gap-1"><Users size={12} /> {course.enrolled_count.toLocaleString("en-IN")} enrolled</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg font-bold text-foreground">{formatINR(course.price)}</span>
                <span className="text-xs text-muted-foreground line-through">{formatINR(course.original_price!)}</span>
              </div>
            ) : course.price > 0 ? (
              <span className="font-display text-lg font-bold text-foreground">{formatINR(course.price)}</span>
            ) : (
              <span className="font-display text-lg font-bold text-emerald-400">Free</span>
            )}
            <Link to={url}>
              <Button size="sm">{course.price > 0 ? "Enroll Now" : "Start Free"}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}