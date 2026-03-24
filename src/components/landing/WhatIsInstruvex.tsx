import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  "AI-powered question generation with Bloom's taxonomy",
  "Secure online examination with anti-cheat proctoring",
  "Real-time performance analytics and insights",
  "Full LMS with video courses and progress tracking",
  "Verifiable digital certificates with QR codes",
  "Multi-tenant architecture for institutions",
];

const WhatIsInstruvex = () => (
  <section className="relative py-24">
    <div className="container mx-auto px-4">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-3 inline-block rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-steel">
            About Instruvex
          </span>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            What is <span className="text-gradient">Instruvex</span>?
          </h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Instruvex is an <strong className="text-foreground">AI-powered learning and assessment platform</strong> designed 
            for educational institutions, instructors, and students. It combines online exams, a full learning management 
            system (LMS), real-time analytics, and a digital certification engine into one unified platform.
          </p>
          <p className="mb-8 text-muted-foreground leading-relaxed">
            Whether you need to create AI-generated question papers, deliver secure online examinations, 
            manage video courses, or issue verifiable certificates — Instruvex handles it all with 
            enterprise-grade security and scalability.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="lg" className="gap-2">
              Get Started Free <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          {highlights.map((text, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-card-gradient p-4 shadow-card"
            >
              <CheckCircle size={20} className="mt-0.5 shrink-0 text-steel" />
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default WhatIsInstruvex;
