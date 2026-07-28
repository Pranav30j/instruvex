import { motion, useReducedMotion } from "framer-motion";

const BARS = [42, 61, 55, 78, 69, 88, 74, 95];
const LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

/** Student performance analytics with animated bars and a trend summary. */
export default function AnalyticsDemo() {
  const reduce = useReducedMotion();

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground">Average cohort score</p>
          <p className="font-display text-2xl font-semibold text-foreground">
            78.4<span className="text-sm text-muted-foreground">/100</span>
          </p>
        </div>
        <span className="rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
          ▲ 12.6% vs last term
        </span>
      </div>

      <div className="flex h-28 items-end gap-1.5">
        {BARS.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-steel/30 to-steel"
            initial={reduce ? false : { height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={reduce ? { height: `${h}%` } : undefined}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {LABELS.map((l) => (
          <span key={l} className="flex-1 text-center text-[9px] text-muted-foreground">
            {l}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
        {[
          { k: "Pass rate", v: "94%" },
          { k: "At risk", v: "6 students" },
          { k: "Submissions", v: "1,284" },
        ].map((s) => (
          <div key={s.k}>
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.k}</p>
            <p className="font-display text-sm font-semibold text-foreground">{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}