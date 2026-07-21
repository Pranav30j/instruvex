import { useState } from "react";
import { motion } from "framer-motion";
import { Download, RefreshCcw, Save, Sparkles, ShieldCheck, Zap } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import UploadDropzone from "@/components/ats/UploadDropzone";
import ScoreRing from "@/components/ats/ScoreRing";
import ScoreBreakdown from "@/components/ats/ScoreBreakdown";
import { extractResume } from "@/lib/ats/extract";
import { analyzeResume } from "@/lib/ats/scoring";
import { exportReportPdf } from "@/lib/ats/pdfReport";
import type { AnalysisResult } from "@/lib/ats/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Instruvex ATS Resume Score Checker",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  url: "https://instruvex.in/ats-checker",
};

export default function ATSChecker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const extracted = await extractResume(file);
      if (!extracted.text || extracted.text.length < 100) {
        throw new Error("Could not extract enough text from this file. If it's a scanned PDF, please upload a text-based version.");
      }
      const analysis = analyzeResume(extracted);
      setResult(analysis);
      enrichWithAI(analysis);
    } catch (e) {
      toast({ title: "Analysis failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const enrichWithAI = async (analysis: AnalysisResult) => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ats-enrich", {
        body: {
          resumeText: analysis.resumeText,
          overallScore: analysis.overallScore,
          warnings: analysis.warnings,
          weakBullets: analysis.suggestions.map((s) => s.before),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult((prev) => {
        if (!prev) return prev;
        const rewrites = Array.isArray(data?.rewrites)
          ? data.rewrites.map((r: any) => ({ section: "Experience", before: r.before, after: r.after, rationale: r.rationale }))
          : prev.suggestions;
        return {
          ...prev,
          aiSummary: data?.summary,
          suggestions: rewrites.length ? rewrites : prev.suggestions,
          warnings: [...prev.warnings, ...(data?.topFixes || []).map((f: string) => `AI: ${f}`)],
        };
      });
    } catch (e) {
      console.warn("AI enrichment failed", e);
    } finally {
      setEnriching(false);
    }
  };

  const handleSave = async () => {
    if (!user || !result) return;
    const { error } = await supabase.from("resume_analyses").insert({
      user_id: user.id,
      file_name: result.fileName,
      file_size: result.fileSize,
      overall_score: result.overallScore,
      category_scores: Object.fromEntries(Object.entries(result.categories).map(([k, v]) => [k, { score: v.score, max: v.max }])) as any,
      strengths: result.strengths,
      warnings: result.warnings,
      suggestions: result.suggestions as any,
      ai_summary: result.aiSummary ?? null,
      resume_text: result.resumeText.slice(0, 20000),
    });
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setSaved(true);
    toast({ title: "Saved", description: "Report added to your dashboard history." });
  };

  const reset = () => { setResult(null); setSaved(false); };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Free ATS Resume Score Checker — Instruvex"
        description="Instantly check your resume's ATS compatibility with Instruvex. Get a 100-point score, keyword insights, and AI-powered rewrite suggestions — free."
        path="/ats-checker"
        jsonLd={JSONLD}
      />
      <Navbar />

      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="container mx-auto px-4 max-w-5xl relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Free ATS Score Checker
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Is your resume <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-accent)" }}>ATS-ready?</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your resume and get an instant 100-point ATS compatibility report — with actionable AI-powered rewrites.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Processed in your browser</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> Under 10 seconds</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> AI rewrite suggestions</span>
            </div>
          </motion.div>

          {!result && <UploadDropzone onFile={handleFile} loading={loading} />}
        </div>
      </section>

      {result && (
        <section className="pb-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-[320px_1fr] gap-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6 text-center h-fit lg:sticky lg:top-24"
              >
                <ScoreRing score={result.overallScore} />
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">ATS Pass Probability</p>
                  <p className="text-2xl font-semibold text-foreground">{result.passProbability}%</p>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{result.recruiterImpression}</p>
                <div className="mt-5 grid gap-2">
                  <button onClick={() => exportReportPdf(result)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium">
                    <Download className="w-4 h-4" /> Download PDF Report
                  </button>
                  {user && (
                    <button onClick={handleSave} disabled={saved} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-sm disabled:opacity-50">
                      <Save className="w-4 h-4" /> {saved ? "Saved to history" : "Save to my dashboard"}
                    </button>
                  )}
                  <button onClick={reset} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-sm">
                    <RefreshCcw className="w-4 h-4" /> Analyze another resume
                  </button>
                </div>
              </motion.div>

              <div className="space-y-6">
                {enriching && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" /> Instruvex AI is enriching your report with recruiter-grade insights…
                  </div>
                )}

                {result.aiSummary && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Recruiter Impression</h3>
                    <p className="text-muted-foreground">{result.aiSummary}</p>
                  </motion.div>
                )}

                <div>
                  <h2 className="text-xl font-semibold mb-3 text-foreground">Score Breakdown</h2>
                  <ScoreBreakdown result={result} />
                </div>

                {result.suggestions.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">Rewrite Suggestions</h2>
                    <div className="space-y-3">
                      {result.suggestions.slice(0, 6).map((s, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{s.section}</p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                              <p className="text-xs font-medium text-red-400 mb-1">Before</p>
                              <p className="text-sm text-foreground/80">{s.before}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                              <p className="text-xs font-medium text-emerald-500 mb-1">After</p>
                              <p className="text-sm text-foreground">{s.after}</p>
                            </div>
                          </div>
                          {s.rationale && <p className="text-xs text-muted-foreground mt-2">{s.rationale}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.keywords.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">Keywords Detected</h2>
                    <div className="rounded-2xl border border-border bg-card p-6 grid gap-3">
                      {result.keywords.map((k) => (
                        <div key={k.group}>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">{k.group}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {k.items.map((it) => (
                              <span key={it} className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs">{it}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
                    <p className="text-foreground font-medium">Save your reports and track improvements over time</p>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to store your analyses in your Instruvex dashboard.</p>
                    <a href="/login" className="inline-block mt-3 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Sign in</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}