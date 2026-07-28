import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Reveal from "@/components/marketing/Reveal";
import Counter from "@/components/marketing/Counter";

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
    { to: Math.max(data?.courses ?? 0, 10), label: "Courses published" },
    { to: Math.max(data?.students ?? 0, 500), label: "Students learning" },
    { to: Math.max(data?.certificates ?? 0, 100), label: "Certificates issued" },
    { to: Math.max(data?.internships ?? 0, 50), label: "Internships completed" },
    { to: 10000, label: "Learning hours" },
  ];

  return (
    <section className="relative hairline-y border-y border-border bg-navy-deep/40 py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05} className="text-center md:text-left">
              <div className="font-display text-3xl font-semibold tracking-tight text-foreground">
                <Counter to={s.to} suffix="+" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;