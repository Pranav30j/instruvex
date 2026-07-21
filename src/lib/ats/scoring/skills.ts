import type { CheckResult } from "../types";
import { SKILL_TAXONOMY } from "./skillsTaxonomy";

export interface SkillsAnalysis extends CheckResult {
  found: { group: string; items: string[] }[];
  missingGroups: string[];
}

export function scoreSkills(text: string): SkillsAnalysis {
  const lower = text.toLowerCase();
  const found: { group: string; items: string[] }[] = [];
  const passed: string[] = [];
  const failed: string[] = [];

  for (const [group, skills] of Object.entries(SKILL_TAXONOMY)) {
    const hits = skills.filter((s) => new RegExp(`(^|[^a-z])${escape(s)}([^a-z]|$)`, "i").test(lower));
    if (hits.length) found.push({ group, items: Array.from(new Set(hits)) });
  }

  const totalHits = found.reduce((a, g) => a + g.items.length, 0);
  const groupsHit = found.length;
  let score = 0;
  if (totalHits >= 15) { score += 8; passed.push(`${totalHits} skills detected`); }
  else if (totalHits >= 8) { score += 5; passed.push(`${totalHits} skills detected`); }
  else if (totalHits >= 3) { score += 3; failed.push("Few skills detected — expand the skills section"); }
  else failed.push("Very few skills detected");

  if (groupsHit >= 5) { score += 5; passed.push(`Coverage across ${groupsHit} categories`); }
  else if (groupsHit >= 3) { score += 3; passed.push(`Coverage across ${groupsHit} categories`); }
  else failed.push("Limited category coverage");

  const softFound = found.find((g) => g.group === "Soft");
  if (softFound) { score += 2; passed.push("Soft skills present"); }
  else failed.push("Soft skills missing");

  const missingGroups = Object.keys(SKILL_TAXONOMY).filter((g) => !found.some((f) => f.group === g));
  if (missingGroups.length) failed.push(`Missing categories: ${missingGroups.slice(0, 3).join(", ")}`);

  return { key: "skills", label: "Skills", score: Math.min(score, 15), max: 15, passed, failed, found, missingGroups };
}

function escape(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
