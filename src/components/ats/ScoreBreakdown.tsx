import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { AnalysisResult } from "@/lib/ats/types";

export default function ScoreBreakdown({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid gap-3">
      {Object.values(result.categories).map((c, i) => {
        const pct = (c.score / c.max) * 100;
        const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card/60 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{c.label}</span>
              <span className="text-sm text-muted-foreground">{c.score}/{c.max}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${color}`}
              />
            </div>
            {(c.passed.length > 0 || c.failed.length > 0) && (
              <div className="mt-3 grid gap-1.5 text-xs">
                {c.passed.slice(0, 3).map((p, idx) => (
                  <div key={`p${idx}`} className="flex items-start gap-2 text-emerald-500">
                    <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{p}</span>
                  </div>
                ))}
                {c.failed.slice(0, 3).map((f, idx) => (
                  <div key={`f${idx}`} className="flex items-start gap-2 text-red-400">
                    <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}