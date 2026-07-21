import type { CheckResult } from "../types";
import { BUZZWORDS, WEAK_VERBS } from "./skillsTaxonomy";

export function scoreReadability(text: string): CheckResult {
  const passed: string[] = [];
  const failed: string[] = [];
  let score = 10;

  const sentences = text.split(/[.!?]\s+/).filter((s) => s.trim().length > 0);
  const avgLen = sentences.length ? sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / sentences.length : 0;
  if (avgLen > 28) { score -= 2; failed.push(`Sentences average ${Math.round(avgLen)} words — keep bullets concise (< 20)`); }
  else passed.push("Sentence length is appropriate");

  const passivePatterns = /\b(was|were|is|are|been|being|be)\s+\w+ed\b/gi;
  const passiveHits = (text.match(passivePatterns) || []).length;
  if (passiveHits > 6) { score -= 2; failed.push(`${passiveHits} passive-voice phrases — prefer active voice`); }
  else passed.push("Mostly active voice");

  const weakUsed = Array.from(WEAK_VERBS).filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
  if (weakUsed.length > 3) { score -= 2; failed.push(`Weak verbs used: ${weakUsed.slice(0, 5).join(", ")}`); }
  else passed.push("Few weak verbs");

  const buzzUsed = Array.from(BUZZWORDS).filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
  if (buzzUsed.length >= 2) { score -= 2; failed.push(`Overused buzzwords: ${buzzUsed.join(", ")}`); }
  else passed.push("Not overloaded with buzzwords");

  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  const repeated = Array.from(freq.entries()).filter(([w, c]) => c > 8 && !["with", "which", "that", "from", "they", "were", "have", "this", "your"].includes(w));
  if (repeated.length > 3) { score -= 2; failed.push(`Repeated words: ${repeated.slice(0, 3).map((r) => r[0]).join(", ")}`); }
  else passed.push("Vocabulary varied");

  return { key: "readability", label: "Readability", score: Math.max(0, Math.min(score, 10)), max: 10, passed, failed };
}
*** End Patch