import type { CheckResult } from "../types";
import { ACTION_VERBS } from "./skillsTaxonomy";

export function scoreExperience(text: string): CheckResult & { weakBullets: string[] } {
  const passed: string[] = [];
  const failed: string[] = [];
  let score = 0;

  const bullets = text.split(/\n/).map((l) => l.trim()).filter((l) => /^[•●▪◦*\-–]/.test(l) || l.length > 40);
  const strong = bullets.filter((b) => {
    const first = b.replace(/^[•●▪◦*\-–\s]+/, "").split(/\s+/)[0]?.toLowerCase() ?? "";
    return ACTION_VERBS.has(first);
  });
  const quantified = bullets.filter((b) => /(\d+%|\$\d+|\d+\+|\d+x|\d{2,})/.test(b));
  const weakBullets = bullets.filter((b) => !/(\d+%|\$\d+|\d+\+|\d+x|\d{2,})/.test(b) && b.length < 80).slice(0, 5);

  if (strong.length >= 8) { score += 5; passed.push(`${strong.length} bullets start with action verbs`); }
  else if (strong.length >= 4) { score += 3; passed.push(`${strong.length} bullets with action verbs`); }
  else failed.push("Few bullets start with strong action verbs");

  if (quantified.length >= 5) { score += 5; passed.push(`${quantified.length} quantified achievements`); }
  else if (quantified.length >= 2) { score += 3; passed.push(`${quantified.length} quantified achievements`); }
  else failed.push("Quantify achievements with numbers, %, and metrics");

  const yearMatches = text.match(/\b(19|20)\d{2}\b/g) || [];
  if (yearMatches.length >= 3) { score += 2; passed.push("Career timeline present"); }
  else failed.push("Add clear year ranges for roles");

  const impactWords = /(led|drove|delivered|shipped|owned|launched|scaled|reduced|increased|improved|generated)/i;
  if (impactWords.test(text)) { score += 3; passed.push("Impact language used"); }
  else failed.push("Add impact-oriented language (led, drove, delivered)");

  return { key: "experience", label: "Experience", score: Math.min(score, 15), max: 15, passed, failed, weakBullets };
}
