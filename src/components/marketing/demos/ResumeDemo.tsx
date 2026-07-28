import { motion, useReducedMotion } from "framer-motion";

const CRITERIA = [
  { label: "Contact & headers", score: 10, max: 10 },
  { label: "Skills match", score: 12, max: 15 },
  { label: "Experience impact", score: 11, max: 15 },
  { label: "ATS formatting", score: 14, max: 15 },
];

/** ATS resume checker result: score ring plus per-criterion bars. */
export default function ResumeDemo() {
  const reduce = useReducedMotion();
  const size = 84;
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const pct = 82;

  return (
    <div className="flex items-center gap-4 p-4 sm:p-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={6} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--success))"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c - (c * pct) / 100 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-semibold text-foreground">{pct}</span>
          <span className="text-[8px] text-muted-foreground">ATS score</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {CRITERIA.map((c2, i) => (
          <div key={c2.label}>
            <div className="mb-1 flex justify-between text-[10px]">
              <span className="truncate text-muted-foreground">{c2.label}</span>
              <span className="text-foreground">
                {c2.score}/{c2.max}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-steel"
                initial={reduce ? false : { width: 0 }}
                whileInView={{ width: `${(c2.score / c2.max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}