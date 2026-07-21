import { motion } from "framer-motion";

export default function ScoreRing({ score, size = 200 }: { score: number; size?: number }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? "hsl(160 84% 45%)" : pct >= 60 ? "hsl(38 92% 55%)" : "hsl(0 84% 60%)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={10} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={10} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-foreground">{pct}</span>
        <span className="text-xs text-muted-foreground mt-1">out of 100</span>
      </div>
    </div>
  );
}