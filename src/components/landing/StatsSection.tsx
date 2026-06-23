import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, Award, Briefcase, Clock } from "lucide-react";

function formatCount(n: number) {
  if (n >= 100000) return (n / 1000).toFixed(0) + "K+";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  return n.toLocaleString("en-IN") + "+";
}

const StatsSection = () => {
  const { data } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [courses, enrollments, certs, internCerts] = await Promise.all([
        supabase.from("academy_courses").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("academy_enrollments").select("user_id", { count: "exact", head: true }),
        supabase.from("academy_certificates").select("id", { count: "exact", head: true }),
        supabase.from("internship_certificates").select("id", { count: "exact", head: true }),
      ]);
      return {
        courses: courses.count || 0,
        students: enrollments.count || 0,
        certificates: certs.count || 0,
        internships: internCerts.count || 0,
      };
    },
  });

  const stats = [
    { icon: BookOpen, value: data ? formatCount(Math.max(data.courses, 10)) : "10+", label: "Total Courses" },
    { icon: GraduationCap, value: data ? formatCount(Math.max(data.students, 500)) : "500+", label: "Students Learning" },
    { icon: Award, value: data ? formatCount(Math.max(data.certificates, 100)) : "100+", label: "Certificates Issued" },
    { icon: Briefcase, value: data ? formatCount(Math.max(data.internships, 50)) : "50+", label: "Internships Completed" },
    { icon: Clock, value: "10K+", label: "Learning Hours" },
  ];

  return (
    <section className="relative border-y border-border bg-navy-elevated/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <s.icon size={24} className="text-steel" />
              <span className="font-display text-2xl font-bold text-foreground md:text-3xl">{s.value}</span>
              <span className="text-xs text-muted-foreground md:text-sm">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;