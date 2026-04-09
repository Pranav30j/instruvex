import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Users,
  BarChart3,
  Brain,
  FileText,
  Award,
  BookOpen,
  Play,
  TrendingUp,
} from "lucide-react";

const products = [
  {
    tag: "Instruvex ERP",
    title: "Smart Institute Management",
    description:
      "Digitize attendance, manage students across batches and departments, and gain real-time visibility into institute operations.",
    features: [
      { icon: ClipboardCheck, text: "Automated attendance tracking with lecture-wise logging" },
      { icon: Users, text: "Student, batch, and department management" },
      { icon: BarChart3, text: "Attendance analytics with CSV export & low-attendance alerts" },
    ],
    gradient: "from-steel to-cyan-accent",
  },
  {
    tag: "Instruvex Exams",
    title: "AI-Powered Examination System",
    description:
      "Create university-level exams with MCQ, subjective, coding, and case-study questions — powered by AI generation and auto-evaluation.",
    features: [
      { icon: Brain, text: "AI question generation with Bloom's taxonomy tagging" },
      { icon: FileText, text: "Anti-cheat proctoring, tab detection & plagiarism analysis" },
      { icon: Award, text: "Instant grading with semantic scoring & code execution" },
    ],
    gradient: "from-steel to-steel-glow",
  },
  {
    tag: "Instruvex Academy",
    title: "Learning & Certification Platform",
    description:
      "A full LMS with video courses, quizzes, assignments, progress tracking, and verifiable digital certificates.",
    features: [
      { icon: BookOpen, text: "Course builder with modules, lectures, and notes" },
      { icon: Play, text: "Video-based learning with progress dashboards" },
      { icon: TrendingUp, text: "Certification engine with QR verification & LinkedIn sharing" },
    ],
    gradient: "from-cyan-accent to-steel",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const ProductsSection = () => (
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
          Our Products
        </span>
        <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
          Three Products, <span className="text-gradient">One Platform</span>
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Everything your institute needs — from classroom operations to AI-driven assessments and student learning.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid gap-8 lg:grid-cols-3"
      >
        {products.map((p) => (
          <motion.div
            key={p.tag}
            variants={item}
            className="group rounded-xl border border-border bg-card-gradient p-8 shadow-card transition-all duration-300 hover:border-steel/30 hover:shadow-glow"
          >
            <div className={`mb-4 inline-block rounded-full bg-gradient-to-r ${p.gradient} px-4 py-1 text-xs font-semibold text-primary-foreground`}>
              {p.tag}
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-foreground">
              {p.title}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            <ul className="space-y-4">
              {p.features.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-steel/10">
                    <f.icon size={14} className="text-steel" />
                  </div>
                  <span className="text-sm text-foreground">{f.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default ProductsSection;
