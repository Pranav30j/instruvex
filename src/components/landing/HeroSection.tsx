import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Shield, BarChart3 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-hero pt-16">
      {/* Glow effects */}
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-steel/5 blur-[120px]" />

      <div className="container relative mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-steel/20 bg-navy-elevated/50 px-4 py-1.5 text-sm text-muted-foreground"
        >
          <Brain size={14} className="text-steel" />
          AI-Powered Academic Intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 max-w-4xl font-display text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl"
        >
          Instruction Meets{" "}
          <span className="text-gradient">Intelligence</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          An AI-powered academic ecosystem integrating assessment, analytics,
          adaptive learning, and certification — under one unified platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <Link to="/signup">
            <Button variant="hero" size="lg" className="gap-2 text-base">
              Start Free Trial <ArrowRight size={18} />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="hero-outline" size="lg" className="text-base">
              Explore Features
            </Button>
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-3 gap-8 md:gap-16"
        >
          {[
            { icon: Brain, label: "AI-Powered Exams", value: "Smart" },
            { icon: Shield, label: "Secure & Scalable", value: "Enterprise" },
            { icon: BarChart3, label: "Real-time Analytics", value: "Deep" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <stat.icon size={24} className="text-steel" />
              <span className="font-display text-lg font-bold text-foreground md:text-xl">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground md:text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
