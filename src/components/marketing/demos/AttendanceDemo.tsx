import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ROLL = [
  { name: "Aarav Sharma", id: "CSE-2201" },
  { name: "Diya Nair", id: "CSE-2202" },
  { name: "Kabir Mehta", id: "CSE-2203" },
  { name: "Ananya Rao", id: "CSE-2204" },
  { name: "Rohan Iyer", id: "CSE-2205" },
];

const STATUS = ["present", "present", "late", "present", "absent"] as const;

const tone: Record<string, string> = {
  present: "border-success/30 bg-success/10 text-success",
  late: "border-warning/30 bg-warning/10 text-warning",
  absent: "border-destructive/30 bg-destructive/10 text-destructive",
};

/** Lecture attendance being marked row by row, as it happens in class. */
export default function AttendanceDemo() {
  const reduce = useReducedMotion();
  const [marked, setMarked] = useState(reduce ? ROLL.length : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setMarked((m) => (m >= ROLL.length ? 0 : m + 1)), 900);
    return () => clearInterval(id);
  }, [reduce]);

  const pct = Math.round((STATUS.slice(0, marked).filter((s) => s !== "absent").length / ROLL.length) * 100);

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-foreground">Operating Systems · Lecture 12</p>
          <p className="text-[11px] text-muted-foreground">Today · 10:30 AM · Room B-204</p>
        </div>
        <p className="font-display text-lg font-semibold text-foreground">{pct}%</p>
      </div>

      <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-steel"
          animate={{ width: `${(marked / ROLL.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <ul className="space-y-1.5">
        {ROLL.map((s, i) => {
          const done = i < marked;
          return (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border bg-navy-elevated/40 px-3 py-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-steel/10 text-[9px] font-semibold text-steel">
                  {s.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-xs text-foreground">{s.name}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">{s.id}</p>
                </div>
              </div>
              <motion.span
                initial={false}
                animate={{ opacity: done ? 1 : 0.25, scale: done ? 1 : 0.94 }}
                transition={{ duration: 0.25 }}
                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium capitalize ${
                  done ? tone[STATUS[i]] : "border-border text-muted-foreground"
                }`}
              >
                {done ? STATUS[i] : "pending"}
              </motion.span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}