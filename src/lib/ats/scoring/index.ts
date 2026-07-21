import type { AnalysisResult, CategoryKey, CheckResult, ExtractedResume, Suggestion } from "../types";
import { scoreContact } from "./contact";
import { scoreSections } from "./sections";
import { scoreFormatting } from "./formatting";
import { scoreReadability } from "./readability";
import { scoreSkills } from "./skills";
import { scoreExperience } from "./experience";
import { scoreProjects } from "./projects";
import { scoreEducation } from "./education";
import { scoreCompliance } from "./compliance";

export function analyzeResume(extracted: ExtractedResume): AnalysisResult {
  const text = extracted.text;
  const wordCount = (text.match(/\b\w+\b/g) || []).length;

  const contact = scoreContact(text);
  const sections = scoreSections(text);
  const formatting = scoreFormatting(extracted);
  const readability = scoreReadability(text);
  const skills = scoreSkills(text);
  const experience = scoreExperience(text);
  const projects = scoreProjects(text);
  const education = scoreEducation(text);
  const compliance = scoreCompliance(text, wordCount);

  const categories: Record<CategoryKey, CheckResult> = {
    contact, sections, formatting, readability, skills, experience, projects, education, compliance,
  };

  const overallScore = Math.round(
    Object.values(categories).reduce((a, c) => a + c.score, 0),
  );

  const strengths: string[] = [];
  const warnings: string[] = [];
  for (const c of Object.values(categories)) {
    const pct = c.score / c.max;
    if (pct >= 0.85 && c.passed[0]) strengths.push(`${c.label}: ${c.passed[0]}`);
    c.failed.forEach((f) => warnings.push(`${c.label}: ${f}`));
  }

  const suggestions: Suggestion[] = experience.weakBullets.map((b) => ({
    section: "Experience",
    before: b,
    after: rewriteBullet(b),
    rationale: "Start with an action verb and quantify the outcome.",
  }));

  const keywords = skills.found.map((f) => ({ group: f.group, items: f.items }));

  const passProbability = Math.max(5, Math.min(98, Math.round(overallScore * 0.9 + 5)));
  const recruiterImpression = deriveImpression(overallScore);

  return {
    overallScore,
    categories,
    strengths,
    warnings,
    suggestions,
    keywords,
    passProbability,
    recruiterImpression,
    resumeText: text,
    fileName: extracted.fileName,
    fileSize: extracted.fileSize,
  };
}

function rewriteBullet(b: string) {
  const clean = b.replace(/^[•●▪◦*\-–\s]+/, "").trim();
  return `Delivered ${clean.toLowerCase()}, driving measurable impact (e.g. +25% throughput, 500+ users, 30% cost reduction).`;
}

function deriveImpression(score: number) {
  if (score >= 90) return "Recruiters will be impressed — this resume is polished and ATS-friendly.";
  if (score >= 75) return "Strong resume with a few refinements needed to stand out.";
  if (score >= 60) return "Passable, but noticeable gaps in structure and impact.";
  return "Significant improvements needed before applying.";
}
*** End Patch