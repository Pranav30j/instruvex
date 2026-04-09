import { motion } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Zap } from "lucide-react";

const problems = [
  "Manual paper-based exams waste time and resources",
  "Scattered systems for attendance, exams, and grades",
  "No plagiarism detection or anti-cheat monitoring",
  "Delayed result processing and certificate generation",
];

const solutions = [
  "AI generates question papers in seconds with Bloom's taxonomy",
  "One unified platform for exams, attendance, LMS, and certificates",
  "Built-in proctoring, plagiarism detection, and security monitoring",
  "Instant auto-grading with real-time analytics and digital certificates",
];

const ProblemSolutionSection = () => (
  <section className="relative py-24 border-t border-border">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
          The Problem
        </span>
        <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
          Why Institutes <span className="text-gradient">Struggle</span>
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Most educational institutions in India still rely on outdated, disconnected tools that waste time and reduce academic quality.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Problems */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-xl border border-destructive/20 bg-card-gradient p-8 shadow-card"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">Without Instruvex</h3>
          </div>
          <ul className="space-y-4">
            {problems.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <X size={18} className="mt-0.5 shrink-0 text-destructive" />
                <span className="text-sm text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Solutions */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-xl border border-steel/20 bg-card-gradient p-8 shadow-card shadow-glow"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel/10">
              <Zap size={20} className="text-steel" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">With Instruvex</h3>
          </div>
          <ul className="space-y-4">
            {solutions.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <CheckCircle size={18} className="mt-0.5 shrink-0 text-steel" />
                <span className="text-sm text-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  </section>
);

export default ProblemSolutionSection;
