import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicCourseRow {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  instructor_name: string;
  category: string | null;
  difficulty: string;
  duration_estimate: string | null;
  price: number;
  original_price: number | null;
  rating: number | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  created_at: string;
  meta_description: string | null;
  learning_outcomes: string[] | null;
}

export function usePublishedCourses() {
  return useQuery({
    queryKey: ["public-academy-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_courses")
        .select("id,slug,title,description,instructor_name,category,difficulty,duration_estimate,price,original_price,rating,thumbnail_url,is_featured,created_at,meta_description,learning_outcomes")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PublicCourseRow[];
    },
  });
}

export function useCourseLectureCounts(courseIds: string[]) {
  return useQuery({
    queryKey: ["academy-public-lecture-counts", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_lectures")
        .select("id, academy_modules!inner(course_id)");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((l: any) => {
        const cid = l.academy_modules?.course_id;
        if (cid && courseIds.includes(cid)) counts[cid] = (counts[cid] || 0) + 1;
      });
      return counts;
    },
  });
}

export function useCourseEnrollmentCounts() {
  return useQuery({
    queryKey: ["academy-public-enrollment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("course_id");
      if (error) return {} as Record<string, number>;
      const counts: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        counts[e.course_id] = (counts[e.course_id] || 0) + 1;
      });
      return counts;
    },
  });
}