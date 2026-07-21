import type { CheckResult } from "../types";
import { SECTION_HEADERS } from "./skillsTaxonomy";

export function scoreSections(text: string): CheckResult {
  const lower = text.toLowerCase();
  const passed: string[] = [];
  const failed: string[] = [];
  const weights: Record<string, number> = {
    summary: 2, skills: 3, experience: 3, projects: 2,
    education: 2, certifications: 1, achievements: 1, languages: 1,
  };
  let score = 0;
  for (const [key, headers] of Object.entries(SECTION_HEADERS)) {
    const found = headers.some((h) => new RegExp(`(^|\\n)\\s*${h.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i").test(lower));
    const w = weights[key] ?? 1;
    if (found) { score += w; passed.push(`${cap(key)} section detected`); }
    else failed.push(`${cap(key)} section missing`);
  }
  return { key: "sections", label: "Section Presence", score: Math.min(score, 15), max: 15, passed, failed };
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
