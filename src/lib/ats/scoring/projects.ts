import type { CheckResult } from "../types";

export function scoreProjects(text: string): CheckResult {
  const passed: string[] = [];
  const failed: string[] = [];
  let score = 0;

  const hasProjectsSection = /\n\s*(projects|personal projects|selected projects)\b/i.test(text);
  if (!hasProjectsSection) {
    failed.push("No dedicated Projects section detected");
    return { key: "projects", label: "Projects", score: 0, max: 10, passed, failed };
  }

  passed.push("Projects section detected");
  score += 2;

  const gh = /github\.com\/[a-z0-9-]+\/[a-z0-9-]+/i.test(text);
  if (gh) { score += 2; passed.push("GitHub repo links included"); }
  else failed.push("Add GitHub links for projects");

  const techMentions = /(using|built with|stack|tech)\s*[:\-]?\s*[a-z]/i.test(text);
  if (techMentions) { score += 2; passed.push("Technology stack described"); }
  else failed.push("Mention the technology stack for each project");

  const impact = /(users|downloads|sales|revenue|reduced|improved|increased|\d+%|\d+\+)/i.test(text);
  if (impact) { score += 2; passed.push("Measurable outcomes present"); }
  else failed.push("Add measurable outcomes to projects");

  const liveDemo = /(demo|live|deployed|hosted|url|link)/i.test(text);
  if (liveDemo) { score += 2; passed.push("Live demo or link mentioned"); }
  else failed.push("Consider linking a live demo");

  return { key: "projects", label: "Projects", score: Math.min(score, 10), max: 10, passed, failed };
}
*** End Patch