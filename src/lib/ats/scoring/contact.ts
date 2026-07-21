import type { CheckResult } from "../types";

export function scoreContact(text: string): CheckResult {
  const passed: string[] = [];
  const failed: string[] = [];
  const t = text;
  const lower = t.toLowerCase();

  const emailMatch = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = t.match(/(\+?\d[\d\s().-]{7,}\d)/);
  const linkedin = /linkedin\.com\/[a-z0-9-]+/i.test(t);
  const github = /github\.com\/[a-z0-9-]+/i.test(t);
  const portfolio = /(https?:\/\/(?!.*(linkedin|github|instagram|facebook|twitter))[a-z0-9.-]+\.[a-z]{2,})/i.test(t);
  const hasName = /^[A-Z][a-z]+\s+[A-Z][a-z]+/m.test(t.trim());
  const hasLocation = /(bangalore|bengaluru|mumbai|delhi|chennai|hyderabad|pune|kolkata|remote|india|united states|usa|uk|canada|singapore|dubai|[A-Z][a-z]+,\s?[A-Z]{2})/i.test(t);
  const professionalEmail = emailMatch && !/@(gmail|yahoo|hotmail|outlook|rediff)\./i.test(emailMatch[0]);

  let score = 0;
  if (hasName) { score += 1; passed.push("Full name detected"); } else failed.push("Full name not clearly detected at the top");
  if (emailMatch) { score += 2; passed.push(professionalEmail ? "Professional email address" : "Email address present"); } else failed.push("Email address missing");
  if (phoneMatch) { score += 2; passed.push("Phone number present"); } else failed.push("Phone number missing");
  if (linkedin) { score += 2; passed.push("LinkedIn profile linked"); } else failed.push("LinkedIn profile missing");
  if (github) { score += 1; passed.push("GitHub profile linked"); } else failed.push("GitHub profile missing");
  if (portfolio) { score += 1; passed.push("Portfolio/website linked"); } else failed.push("Portfolio website missing");
  if (hasLocation) { score += 1; passed.push("Location detected"); } else failed.push("Location not detected");

  return { key: "contact", label: "Contact Information", score: Math.min(score, 10), max: 10, passed, failed, details: { email: emailMatch?.[0], hasLinkedin: linkedin, hasGithub: github } };
  void lower;
}