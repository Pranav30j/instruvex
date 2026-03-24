import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Brain, GraduationCap, Award, BarChart3, Shield, Globe, Zap, Target, Eye } from "lucide-react";

const features = [
  { icon: Brain, title: "AI-Powered Exams", desc: "Generate intelligent question papers using Bloom's taxonomy and AI models." },
  { icon: GraduationCap, title: "Academy LMS", desc: "Full learning management with video courses, notes, quizzes, and progress tracking." },
  { icon: Award, title: "Digital Certificates", desc: "Issue verifiable certificates with QR codes for exams and internships." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Deep insights into student performance, engagement, and institutional metrics." },
];

const values = [
  { icon: Zap, title: "Innovation First", desc: "We push boundaries with cutting-edge AI to transform how education works." },
  { icon: Shield, title: "Trust & Security", desc: "Enterprise-grade security with role-based access and anti-cheat proctoring." },
  { icon: Globe, title: "Scalable Platform", desc: "Multi-tenant architecture serving individual instructors to large institutions." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel"
        >
          About Us
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-3xl font-display text-4xl font-bold text-foreground md:text-6xl"
        >
          About <span className="text-gradient">Instruvex</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Building the future of AI-powered education and assessment
        </motion.p>
      </div>
    </section>

    {/* Company Overview */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 font-display text-3xl font-bold text-foreground">
            Who We Are
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Instruvex is an <strong className="text-foreground">AI-powered academic intelligence platform</strong> that
            integrates assessment, learning, analytics, and certification into one unified ecosystem. We empower
            educational institutions, instructors, and students with intelligent tools that make learning measurable,
            engaging, and impactful.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            From AI-generated question papers to a full-featured learning management system, Instruvex delivers
            enterprise-grade capabilities with the simplicity modern educators deserve.
          </p>
        </div>
      </div>
    </section>

    {/* Vision & Mission */}
    <section className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card-gradient p-8 shadow-card"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-steel to-cyan-accent">
              <Eye size={24} className="text-primary-foreground" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-foreground">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To transform education globally by making AI-driven learning accessible, measurable, and impactful for
              every institution and learner — bridging the gap between traditional education and intelligent technology.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card-gradient p-8 shadow-card"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-steel to-cyan-accent">
              <Target size={24} className="text-primary-foreground" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-foreground">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To provide intelligent learning and assessment systems that empower educators with AI-powered tools,
              give students personalized learning experiences, and help institutions make data-driven decisions.
            </p>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Key Features */}
    <section className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center font-display text-3xl font-bold text-foreground">
          What Makes Instruvex <span className="text-gradient">Powerful</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card-gradient p-6 shadow-card"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <f.icon size={20} className="text-steel" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Why Instruvex */}
    <section className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center font-display text-3xl font-bold text-foreground">
          Why Choose <span className="text-gradient">Instruvex</span>?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <v.icon size={24} className="text-steel" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default About;
