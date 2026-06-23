
# Instruvex Academy Upgrade Plan

A large, multi-part upgrade. I'll ship it in coherent phases so each is reviewable and testable. Let me know if you'd like any phase deferred or expanded.

---

## Phase 1 — INR Currency Conversion (no data migration)

Replace `$` with `₹` everywhere prices are rendered. Prices stay in the existing `price` numeric column — we simply re-interpret/format them as INR. No DB migration needed unless you want me to convert existing values mathematically.

Files to update:
- `src/pages/AcademyHome.tsx` — course cards (`$${price}`, `Enroll – $`)
- `src/pages/AcademyCourseDetail.tsx` — detail price + checkout
- `src/pages/AcademyCourseCreate.tsx` — form label "Price (USD)" → "Price (INR)"
- `src/pages/AcademyManage.tsx` — listings
- `src/components/landing/PricingSection.tsx` — subscription plans
- Any revenue/admin dashboards rendering currency
- New helper: `src/lib/currency.ts` exporting `formatINR(n)` → `₹1,234` (uses `Intl.NumberFormat('en-IN')`)

**Question for you:** Are existing course prices already INR values (just displayed with $), or do they need mathematical conversion (× ~83)? I'll assume **values are already INR** and only swap the symbol unless you tell me otherwise.

---

## Phase 2 — Public Academy Discovery (no login required)

New public routes:
- `/academy` — public Academy home with hero, featured courses, full catalog, filters, search
- `/academy/course/:slug` — public course detail page (currently `/dashboard/academy/course/:id`, dashboard route preserved)
- `/academy/:category` — SEO category landing pages (data-science, ai, web-development, programming, gate-preparation)

DB migration:
- Add `slug TEXT UNIQUE` to `academy_courses`, auto-populated from title (backfill existing rows)
- Add `original_price NUMERIC` (for discount badge), `rating NUMERIC`, `enrolled_count` (computed view or denormalized counter)
- Adjust `academy_courses` SELECT RLS to allow `anon` to read `is_published = true` rows (currently auth-only). Same for `academy_modules`/`academy_lectures` metadata used on the public detail page — lecture **content** stays gated.

Homepage integration:
- New `src/components/landing/FeaturedCoursesSection.tsx` injected into `src/pages/Index.tsx` between `AcademySection` and `PricingSection`
- Fetches up to 8 published courses, ordered by `is_featured DESC, created_at DESC`
- Card shows: thumbnail, title, instructor, category, duration, lecture count, level, ₹ price, discount badge, rating, enrolled count, View / Enroll buttons

---

## Phase 3 — SEO Foundation

- Install `react-helmet-async`, wrap app in `<HelmetProvider>` in `src/main.tsx`
- Per-route `<Helmet>` on: Index, `/academy`, `/academy/course/:slug`, `/academy/:category`, About, Blog, BlogPost, Careers, CareerDetail, Contact, legal pages
- Structured data:
  - Sitewide `Organization` + `WebSite` in `index.html` (keep existing)
  - Per-course `Course` schema (name, description, provider, instructor, price `priceCurrency: INR`, duration, aggregateRating)
  - Per-category `ItemList` schema
- Canonical + og:url self-reference each route
- Homepage meta title/description tuned to target keywords listed in the brief

---

## Phase 4 — Dynamic sitemap + robots

- Create `scripts/generate-sitemap.ts` that runs on `predev` / `prebuild`
- Pulls all published courses + categories from Supabase using `SUPABASE_URL` + anon key (read-only public data) and writes `public/sitemap.xml`
- Static entries: `/`, `/about`, `/blog`, `/contact`, `/careers`, `/verify`, `/academy`, `/terms-and-conditions`, `/privacy-policy`, `/refund-policy`
- Dynamic: every published course slug, every category page, every published blog post
- `public/robots.txt` already correct; add nothing besides confirming the sitemap URL

---

## Phase 5 — Search, Filters, Sort

Already partially present in dashboard Academy; build a richer version on `/academy`:
- Search box (title + description)
- Filters: category, price (free / paid / range), duration bucket, difficulty
- Sort: popularity (enrolled_count desc), latest, price asc/desc
- URL-synced filter state (`?category=ai&sort=latest`) so filtered views are linkable + indexable

---

## Phase 6 — Homepage Stats + Trust Section

- Live counters fetched from Supabase (`academy_courses` count, distinct `academy_enrollments.user_id`, `academy_certificates` count, `internship_certificates` count, sum of `duration_estimate` parsed to hours)
- New trust components: testimonials carousel, certificate showcase strip, placement stories, partner logos, instructor profiles grid
- For content I don't have data for (testimonials, placement stories, partner logos), I'll scaffold the components with clearly-marked sample data and a TODO for you to fill in — I will **not** invent fake reviews or fabricate partner names.

---

## Phase 7 — Performance polish

- `<img loading="lazy" decoding="async">` on all course thumbnails
- Route-level code splitting via `React.lazy` for Academy public routes
- Slug-based course URLs (already in Phase 2)

---

## Open questions before I start

1. **INR conversion**: existing `price` values are already in INR (just re-label), or convert × 83? *(Default: re-label only.)*
2. **Phase scope**: ship all 7 phases now, or just Phase 1+2+3+4 (currency + public discovery + SEO + sitemap) and defer 5–7? *(Default: ship all 7.)*
3. **Sample data for trust section**: scaffold with placeholders, or skip those components until you provide real content? *(Default: scaffold with clearly-marked placeholders.)*

Reply with answers (or "go ahead with defaults") and I'll start implementing. This will involve a database migration, several new files, and edits across ~15 existing files.
