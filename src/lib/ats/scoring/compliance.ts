import type { CheckResult } from "../types";

export function scoreCompliance(text: string, wordCount: number): CheckResult {
  const passed: string[] = [];
  const failed: string[] = [];
  let score = 5;

  if (wordCount < 250) { score -= 2; failed.push(`Only ${wordCount} words — resume feels thin`); }
  else if (wordCount > 1400) { score -= 2; failed.push(`${wordCount} words — trim to 1-2 pages`); }
  else passed.push(`Length is appropriate (${wordCount} words)`);

  const firstPerson = /\b(I|me|my|myself)\b/g;
  const fpHits = (text.match(firstPerson) || []).length;
  if (fpHits > 3) { score -= 1; failed.push("Avoid first-person pronouns (I, me, my)"); }
  else passed.push("Uses professional voice");

  const unicodeIssues = /[^\x00-\x7F]/.test(text);
  if (!unicodeIssues) passed.push("ASCII-clean text");

  return { key: "compliance", label: "Overall Compliance", score: Math.max(0, Math.min(score, 5)), max: 5, passed, failed };
}
