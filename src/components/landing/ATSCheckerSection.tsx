import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileCheck2, Sparkles, ArrowRight } from "lucide-react";

export default function ATSCheckerSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-border bg-card p-8 md:p-14 overflow-hidden"
          style={{ backgroundImage: "var(--gradient-card)" }}
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl" style={{ background: "hsl(217 91% 60% / 0.15)" }} />
          <div className="grid md:grid-cols-2 gap-10 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
                <Sparkles className="w-3.5 h-3.5" /> New — Free Tool
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Beat the bots with the <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-accent)" }}>ATS Resume Checker</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Upload your resume and get an instant 100-point ATS compatibility score, keyword insights, and AI-powered rewrite suggestions — completely free.
              </p>
              <ul className="space-y-2 mb-8 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-primary" /> 9 weighted scoring categories</li>
                <li className="flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-primary" /> Recruiter-style AI feedback</li>
                <li className="flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-primary" /> Download branded PDF report</li>
              </ul>
              <Link to="/ats-checker" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
                Check my resume <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-border bg-background/80 p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">resume_2026.pdf</span>
                  <span className="text-4xl font-bold text-emerald-500">87</span>
                </div>
                {[
                  ["Contact Info", 90],
                  ["Skills", 82],
                  ["Experience", 88],
                  ["Formatting", 76],
                ].map(([l, v]) => (
                  <div key={l as string} className="mb-3">
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{l}</span><span className="text-foreground">{v}%</span></div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}