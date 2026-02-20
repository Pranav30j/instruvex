import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  BarChart3,
  GraduationCap,
  Award,
  Shield,
  BookOpen,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Question Generation",
    description: "Generate MCQs, subjective, and coding questions with Bloom's taxonomy tagging and difficulty levels.",
  },
  {
    icon: FileText,
    title: "Smart Examination",
    description: "Anti-cheat proctoring, auto-save, timer lock, tab detection, and randomized question delivery.",
  },
  {
    icon: Zap,
    title: "Auto Evaluation",
    description: "Instant MCQ grading, AI semantic scoring for subjective answers, and code execution for programming tasks.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Score trends, weak-topic heatmaps, discrimination indices, and batch-level comparisons in real time.",
  },
  {
    icon: BookOpen,
    title: "Question Bank",
    description: "Categorized repository with AI tagging, duplicate detection, bulk upload, and advanced search filters.",
  },
  {
    icon: GraduationCap,
    title: "Instruvex Academy",
    description: "Full LMS with video lectures, quizzes, assignments, progress tracking, and certification exams.",
  },
  {
    icon: Award,
    title: "Certification Engine",
    description: "Auto-generated PDF certificates with unique IDs, QR verification, and LinkedIn sharing.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "JWT auth, RBAC, encrypted data, rate limiting, and multi-tenant isolation for institutes.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => (
  <section id="features" className="relative py-24">
    <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-steel/5 blur-[150px]" />
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
          Platform Features
        </span>
        <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
          Everything You Need to <span className="text-gradient">Excel</span>
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          A comprehensive suite of AI-driven tools designed for modern academic institutions.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={item}
            className="group rounded-xl border border-border bg-card-gradient p-6 shadow-card transition-all duration-300 hover:border-steel/30 hover:shadow-glow"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-steel/10 text-steel transition-colors group-hover:bg-steel/20">
              <f.icon size={22} />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {f.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
