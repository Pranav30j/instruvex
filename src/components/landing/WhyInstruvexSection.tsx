import { motion } from "framer-motion";
import { Brain, Layers, MapPin, Clock, Shield, Zap } from "lucide-react";

const reasons = [
  {
    icon: Brain,
    title: "AI-Powered Automation",
    description: "From question generation to grading — AI handles the heavy lifting so educators can focus on teaching.",
  },
  {
    icon: Layers,
    title: "All-in-One System",
    description: "No more juggling between tools. Exams, attendance, LMS, certificates — everything in one platform.",
  },
  {
    icon: MapPin,
    title: "Built for Indian Institutes",
    description: "Designed specifically for schools, colleges, and coaching institutes across India with local workflows.",
  },
  {
    icon: Clock,
    title: "Save Time & Cost",
    description: "Reduce manual work by 80%. Automate attendance, exam creation, evaluation, and report generation.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "Anti-cheat proctoring, plagiarism detection, role-based access control, and encrypted data storage.",
  },
  {
    icon: Zap,
    title: "Instant Results & Analytics",
    description: "Real-time auto-grading with deep performance insights, trend analysis, and exportable reports.",
  },
];

const WhyInstruvexSection = () => (
  <section className="relative py-24 border-t border-border">
    <div className="pointer-events-none absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan-accent/5 blur-[150px]" />
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
          Why Choose Us
        </span>
        <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
          Why <span className="text-gradient">Instruvex</span>?
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Purpose-built for Indian educational institutions with AI at its core.
        </p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group rounded-xl border border-border bg-card-gradient p-6 shadow-card transition-all duration-300 hover:border-steel/30 hover:shadow-glow"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-steel/10 text-steel transition-colors group-hover:bg-steel/20">
              <r.icon size={22} />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
              {r.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {r.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyInstruvexSection;
