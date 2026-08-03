import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const QUESTIONS = [
  { q: "Explain the time complexity of quicksort in the average case.", type: "Subjective", bloom: "Analyze", marks: 6 },
  { q: "Which normalization form removes transitive dependency?", type: "MCQ", bloom: "Remember", marks: 2 },
  { q: "Implement a function to detect a cycle in a linked list.", type: "Coding", bloom: "Apply", marks: 10 },
  { q: "Case study: optimise a hospital's patient triage workflow.", type: "Case Study", bloom: "Evaluate", marks: 12 },
];

const typeTone: Record<string, string> = {
  MCQ: "text-steel border-steel/30 bg-steel/10",
  Subjective: "text-cyan-accent border-cyan-accent/30 bg-cyan-accent/10",
  Coding: "text-success border-success/30 bg-success/10",
  "Case Study": "text-warning border-warning/30 bg-warning/10",
};

/** Simulates the AI question generator streaming questions into an exam. */
export default function ExamBuilderDemo() {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(reduce ? QUESTIONS.length : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setCount((c) => (c >= QUESTIONS.length ? 0 : c + 1));
    }, 1400);
    return () => clearInterval(id);
  }, [reduce]);

  const generating = count < QUESTIONS.length;

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-foreground">Data Structures — Mid Term</p>
          <p className="text-[11px] text-muted-foreground">B.Tech CSE · Semester 4 · 90 minutes</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-steel/25 bg-steel/10 px-2.5 py-1 text-[10px] font-medium text-steel">
          <span className={`h-1.5 w-1.5 rounded-full bg-steel ${generating ? "animate-pulse" : ""}`} />
          {generating ? "Generating…" : "4 questions ready"}
        </div>
      </div>

      <div className="space-y-2">
        {/* All rows stay mounted so the demo never changes document height while
            the user is scrolling (mobile browsers jump when this happens). */}
        {QUESTIONS.map((item, i) => (
          <motion.div
            key={item.q}
            initial={false}
            animate={reduce ? { opacity: 1 } : { opacity: i < count ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden={i >= count}
            className="rounded-md border border-border bg-navy-elevated/40 p-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">Q{i + 1}</span>
              <p className="flex-1 text-xs leading-relaxed text-foreground">{item.q}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7">
              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${typeTone[item.type]}`}>
                {item.type}
              </span>
              <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                Bloom · {item.bloom}
              </span>
              <span className="text-[9px] text-muted-foreground">{item.marks} marks</span>
            </div>
          </motion.div>
        ))}

        <div
          aria-hidden={!generating}
          className={`flex items-center gap-2 rounded-md border border-dashed border-border/70 p-3 transition-opacity duration-300 ${
            generating ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="h-3 w-3 animate-spin rounded-full border border-steel/30 border-t-steel" />
          <span className="text-[11px] text-muted-foreground">
            Drafting question {Math.min(count + 1, QUESTIONS.length)}
            <span className="animate-caret-blink">▌</span>
          </span>
        </div>
      </div>
    </div>
  );
}