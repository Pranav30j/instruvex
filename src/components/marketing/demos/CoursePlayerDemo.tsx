import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const LESSONS = [
  "Introduction to Neural Networks",
  "Activation Functions in Practice",
  "Backpropagation, Step by Step",
  "Training Your First Model",
];

/** Academy course player with progressing playhead and lesson checklist. */
export default function CoursePlayerDemo() {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(reduce ? 64 : 8);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setProgress((p) => (p >= 96 ? 8 : p + 2)), 260);
    return () => clearInterval(id);
  }, [reduce]);

  const activeIndex = Math.min(LESSONS.length - 1, Math.floor((progress / 100) * LESSONS.length));

  return (
    <div className="grid gap-0 sm:grid-cols-[1.4fr_1fr]">
      <div className="p-4">
        <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-navy-deep">
          <div className="absolute inset-0 bg-[var(--gradient-glow)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-steel/40 bg-steel/15 text-steel">
              ▶
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full bg-steel" animate={{ width: `${progress}%` }} transition={{ duration: 0.25 }} />
            </div>
          </div>
        </div>
        <p className="mt-2.5 font-display text-sm font-semibold text-foreground">{LESSONS[activeIndex]}</p>
        <p className="text-[11px] text-muted-foreground">Module 2 · Deep Learning Foundations</p>
      </div>

      <div className="border-t border-border p-4 sm:border-l sm:border-t-0">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">Course progress</p>
        <p className="mb-3 font-display text-xl font-semibold text-foreground">{Math.round(progress)}%</p>
        <ul className="space-y-2">
          {LESSONS.map((l, i) => (
            <li key={l} className="flex items-start gap-2 text-[11px]">
              <span
                className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[8px] ${
                  i < activeIndex
                    ? "border-success/40 bg-success/15 text-success"
                    : i === activeIndex
                      ? "border-steel/50 bg-steel/15 text-steel"
                      : "border-border text-muted-foreground"
                }`}
              >
                {i < activeIndex ? "✓" : ""}
              </span>
              <span className={i <= activeIndex ? "text-foreground" : "text-muted-foreground"}>{l}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}