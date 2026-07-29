import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import BrowserFrame from "@/components/marketing/BrowserFrame";
import ExamBuilderDemo from "@/components/marketing/demos/ExamBuilderDemo";
import ResumeDemo from "@/components/marketing/demos/ResumeDemo";
import AttendanceDemo from "@/components/marketing/demos/AttendanceDemo";

const TRUSTED_BY = [
  "Sinhgad Institutes",
  "Nalanda Polytechnic",
  "Vidya Coaching",
  "Amrita Academy",
  "GATE Forge",
  "Skillbridge",
];

const HeroSection = () => {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative overflow-hidden bg-hero pb-20 pt-28 md:pb-28 md:pt-36">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-glow" />

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* Copy */}
          <div className="max-w-xl">
            <motion.div
              {...rise(0)}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-navy-elevated/50 px-3 py-1 text-[11px] text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-steel" />
              Built for Indian schools, colleges & institutes
            </motion.div>

            <motion.h1
              {...rise(0.08)}
              className="font-display text-[2.6rem] font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-[3.6rem]"
            >
              Run exams, attendance and learning
              <span className="block text-gradient">on one AI platform.</span>
            </motion.h1>

            <motion.p {...rise(0.16)} className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              Instruvex generates question papers, proctors and grades exams, tracks attendance,
              and issues verifiable certificates — replacing five disconnected tools with one system.
            </motion.p>

            <motion.div {...rise(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#book-demo">
                <Button variant="hero" size="lg" className="w-full gap-2 sm:w-auto">
                  Book a demo <ArrowRight size={16} />
                </Button>
              </a>
              <Link to="/signup" onClick={() => trackEvent(ANALYTICS_EVENTS.startFreeTrial, { location: "hero" })}>
                <Button variant="hero-outline" size="lg" className="w-full sm:w-auto">
                  Start free trial
                </Button>
              </Link>
            </motion.div>

            <motion.p {...rise(0.3)} className="mt-4 text-xs text-muted-foreground">
              No credit card required · Setup in under a day
            </motion.p>
          </div>

          {/* Product preview cluster */}
          <motion.div {...rise(0.2)} className="relative">
            <BrowserFrame url="instruvex.in/dashboard/exams/create" className="relative z-10">
              <ExamBuilderDemo />
            </BrowserFrame>

            <motion.div
              className="absolute -bottom-10 -left-4 z-20 hidden w-[248px] overflow-hidden rounded-lg border border-border bg-navy-surface shadow-[var(--shadow-elevated)] sm:block"
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="border-b border-border px-3 py-1.5 text-[10px] text-muted-foreground">
                ATS Resume Score
              </p>
              <ResumeDemo />
            </motion.div>

            <motion.div
              className="absolute -right-4 -top-10 z-0 hidden w-[260px] overflow-hidden rounded-lg border border-border bg-navy-surface shadow-[var(--shadow-elevated)] lg:block"
              animate={reduce ? undefined : { y: [0, 10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="max-h-[210px] overflow-hidden">
                <AttendanceDemo />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Trusted by */}
        <motion.div {...rise(0.4)} className="mt-24 md:mt-32">
          <p className="mb-5 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Trusted by institutes and academies across India
          </p>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max animate-marquee items-center gap-12">
              {[...TRUSTED_BY, ...TRUSTED_BY].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="whitespace-nowrap font-display text-sm font-medium tracking-tight text-muted-foreground/70"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
