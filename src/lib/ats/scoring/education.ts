import type { CheckResult } from "../types";

export function scoreEducation(text: string): CheckResult {
  const passed: string[] = [];
  const failed: string[] = [];
  let score = 0;

  const hasSection = /\n\s*(education|academic)/i.test(text);
  if (!hasSection) {
    failed.push("Education section missing");
    return { key: "education", label: "Education", score: 0, max: 5, passed, failed };
  }
  score += 1;
  passed.push("Education section detected");

  const degree = /(b\.?tech|m\.?tech|bachelor|master|ph\.?d|b\.?e\b|m\.?e\b|b\.?sc|m\.?sc|mba|b\.?com|diploma|associate)/i.test(text);
  if (degree) { score += 2; passed.push("Degree specified"); }
  else failed.push("Degree not clearly listed");

  const institute = /(university|institute|college|iit|nit|iiit|iisc|school)/i.test(text);
  if (institute) { score += 1; passed.push("Institute detected"); }
  else failed.push("Institute not detected");

  const year = /\b(19|20)\d{2}\b/.test(text);
  if (year) { score += 1; passed.push("Graduation year present"); }
  else failed.push("Add graduation year");

  return { key: "education", label: "Education", score: Math.min(score, 5), max: 5, passed, failed };
}
*** End Patch