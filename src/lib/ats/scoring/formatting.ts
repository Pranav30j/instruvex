import type { CheckResult, ExtractedResume } from "../types";

export function scoreFormatting(extracted: ExtractedResume): CheckResult {
  const passed: string[] = [];
  const failed: string[] = [];
  let score = 15;
  const layout = extracted.layout;
  const text = extracted.text;

  if (layout) {
    if (layout.columns > 1) { score -= 4; failed.push(`Multi-column layout detected (${layout.columns} columns) — many ATS parse single-column better`); }
    else passed.push("Single-column layout");

    if (layout.imageCount > 2) { score -= 3; failed.push(`${layout.imageCount} images/graphics detected — ATS cannot read images`); }
    else if (layout.imageCount > 0) { score -= 1; failed.push("Contains images/icons — prefer text"); }
    else passed.push("No embedded images");

    const unique = new Set(layout.fontSizes.map((s) => Math.round(s))).size;
    if (unique > 6) { score -= 2; failed.push(`${unique} different font sizes — reduce for consistency`); }
    else passed.push("Consistent font sizing");

    const tiny = layout.fontSizes.filter((s) => s < 9).length;
    if (tiny > 20) { score -= 2; failed.push("Very small fonts detected — may be unreadable"); }

    if (layout.pageCount > 3) { score -= 2; failed.push(`${layout.pageCount} pages — keep to 1-2 pages`); }
    else passed.push(`${layout.pageCount} page${layout.pageCount > 1 ? "s" : ""}`);
  }

  const bulletLines = (text.match(/^\s*[•●▪◦*\-–]/gm) || []).length;
  if (bulletLines >= 5) passed.push(`${bulletLines} bullet points detected`);
  else { score -= 2; failed.push("Very few bullet points — use bullets for achievements"); }

  if (extracted.warnings.length > 0) {
    score -= Math.min(3, extracted.warnings.length);
    extracted.warnings.forEach((w) => failed.push(w));
  }

  return { key: "formatting", label: "Formatting", score: Math.max(0, Math.min(score, 15)), max: 15, passed, failed };
}
*** End Patch