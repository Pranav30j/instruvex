/**
 * Runs before `vite dev` and `vite build` via npm hooks.
 * Fetches published Academy courses + blog posts from Supabase and writes public/sitemap.xml.
 */
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://instruvex.in";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gsbcvaowlzmzprdmnrfj.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmN2YW93bHptenByZG1ucmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODM5MDgsImV4cCI6MjA4NzE1OTkwOH0.Rwgs0Gpfd4Ny6k3sJGEKwT2R1G-N_2gEfF-Ds-O_caA";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", lastmod: TODAY, changefreq: "weekly", priority: "1.0" },
  { path: "/about", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
  { path: "/blog", lastmod: TODAY, changefreq: "weekly", priority: "0.9" },
  { path: "/contact", lastmod: TODAY, changefreq: "monthly", priority: "0.7" },
  { path: "/careers", lastmod: TODAY, changefreq: "monthly", priority: "0.6" },
  { path: "/verify", lastmod: TODAY, changefreq: "monthly", priority: "0.5" },
  { path: "/academy", lastmod: TODAY, changefreq: "daily", priority: "0.95" },
  { path: "/academy/data-science", lastmod: TODAY, changefreq: "weekly", priority: "0.8" },
  { path: "/academy/artificial-intelligence", lastmod: TODAY, changefreq: "weekly", priority: "0.8" },
  { path: "/academy/web-development", lastmod: TODAY, changefreq: "weekly", priority: "0.8" },
  { path: "/academy/programming", lastmod: TODAY, changefreq: "weekly", priority: "0.8" },
  { path: "/academy/gate-preparation", lastmod: TODAY, changefreq: "weekly", priority: "0.8" },
  { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
];

async function fetchTable(table: string, query: string): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

function buildXml(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ].filter(Boolean).join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const entries: SitemapEntry[] = [...STATIC_ENTRIES];

  const courses = await fetchTable(
    "academy_courses",
    "select=slug,id,updated_at&is_published=eq.true",
  );
  courses.forEach((c) => {
    const slug = c.slug || c.id;
    entries.push({
      path: `/academy/course/${slug}`,
      lastmod: (c.updated_at || "").slice(0, 10) || TODAY,
      changefreq: "weekly",
      priority: "0.85",
    });
  });

  const posts = await fetchTable(
    "blog_posts",
    "select=slug,updated_at&status=eq.published",
  );
  posts.forEach((p) => {
    if (!p.slug) return;
    entries.push({
      path: `/blog/${p.slug}`,
      lastmod: (p.updated_at || "").slice(0, 10) || TODAY,
      changefreq: "monthly",
      priority: "0.6",
    });
  });

  writeFileSync(resolve("public/sitemap.xml"), buildXml(entries));
  console.log(`sitemap.xml written (${entries.length} entries, ${courses.length} courses, ${posts.length} posts)`);
}

main().catch((e) => {
  console.warn("sitemap generation failed, keeping existing public/sitemap.xml:", e?.message || e);
});