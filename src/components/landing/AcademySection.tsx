import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play, BookOpen, Award, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  { icon: BookOpen, title: "Browse & Enroll", desc: "Explore curated courses and start learning instantly." },
  { icon: Play, title: "Learn at Your Pace", desc: "Video lectures, notes, and interactive quizzes." },
  { icon: TrendingUp, title: "Track Progress", desc: "Real-time dashboards show your learning journey." },
  { icon: Award, title: "Get Certified", desc: "Pass the final exam and earn a verifiable certificate." },
];

const AcademySection = () => (
  <section id="academy" className="relative py-24">
    <div className="pointer-events-none absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-accent/5 blur-[150px]" />
    <div className="container mx-auto px-4">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
            Instruvex Academy
          </span>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Learn, Grow, <span className="text-gradient">Certify</span>
          </h2>
          <p className="mb-8 max-w-lg text-muted-foreground">
            A fully integrated learning management system with video courses,
            assessments, progress tracking, and industry-recognized certifications.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="lg" className="gap-2">
              Explore Academy <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="rounded-xl border border-border bg-card-gradient p-5 shadow-card transition-all duration-300 hover:border-steel/30"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-steel/10 text-steel">
                <s.icon size={20} />
              </div>
              <h4 className="mb-1 font-display text-sm font-semibold text-foreground">
                {s.title}
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default AcademySection;
