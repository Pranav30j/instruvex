import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Certificate ID being verified, ending in a success state. */
export default function CertificateDemo() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<0 | 1 | 2>(reduce ? 2 : 0);

  useEffect(() => {
    if (reduce) return;
    const seq = [
      setTimeout(() => setStage(1), 900),
      setTimeout(() => setStage(2), 2000),
    ];
    const loop = setInterval(() => {
      setStage(0);
      setTimeout(() => setStage(1), 900);
      setTimeout(() => setStage(2), 2000);
    }, 5200);
    return () => {
      seq.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [reduce]);

  return (
    <div className="p-4 sm:p-5">
      <p className="mb-2 text-[11px] text-muted-foreground">Public certificate verification</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border border-border bg-navy-elevated/50 px-3 py-2 font-mono text-[11px] text-foreground">
          INS-INT-2026-0472
          {stage === 0 && <span className="animate-caret-blink">▌</span>}
        </div>
        <div className="rounded-md bg-steel px-3 py-2 text-[11px] font-semibold text-primary-foreground">
          Verify
        </div>
      </div>

      <div className="mt-3 h-[132px]">
        {stage === 1 && (
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            <span className="h-3 w-3 animate-spin rounded-full border border-steel/30 border-t-steel" />
            <span className="text-[11px] text-muted-foreground">Checking registry…</span>
          </div>
        )}
        {stage === 2 && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-md border border-success/30 bg-success/5 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-[10px] text-success">
                ✓
              </span>
              <span className="text-[11px] font-semibold text-success">Certificate verified</span>
            </div>
            <dl className="grid grid-cols-2 gap-y-1.5 text-[10px]">
              {[
                ["Holder", "Ananya Rao"],
                ["Programme", "AI & Machine Learning"],
                ["Issued", "12 Mar 2026"],
                ["Issuer", "Instruvex Academy"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </div>
    </div>
  );
}