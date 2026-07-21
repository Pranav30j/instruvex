# ATS Resume Score Checker

A production-ready, explainable resume analyzer built into Instruvex — matching the existing dark/metallic navy theme, blue accents, glassmorphism, and Space Grotesk/Inter typography.

## Scope

- Public tool (no login required) with an optional saved-history dashboard for logged-in users.
- Deterministic, weighted scoring engine (100 pts) with AI-augmented qualitative feedback via Lovable AI Gateway (`google/gemini-3-flash-preview`).
- Beautiful PDF report export.

## Architecture

Modular so future modules (Resume Builder, JD Match, Rewriter, Cover Letter, Interview Prep) can reuse the same primitives.

```
src/
  pages/
    ATSChecker.tsx              # /ats-checker public page
    dashboard/ResumeHistory.tsx # /dashboard/resume-history
  components/ats/
    ResumeUploader.tsx          # dropzone, validation, progress
    ProcessingStages.tsx        # animated stage list
    ScoreCircle.tsx             # animated circular score
    CategoryBar.tsx             # progress bar row
    SectionCard.tsx             # status + explanation + suggestions
    KeywordCloud.tsx
    SuggestionCard.tsx          # before/after + copy
    StrengthsWarnings.tsx
    ReportExport.tsx            # PDF (jsPDF + html2canvas)
  lib/ats/
    extract.ts                  # pdfjs-dist + mammoth text extraction
    scoring/
      index.ts                  # runAllChecks -> { total, categories, findings }
      contact.ts   (10)
      sections.ts  (15)
      formatting.ts(15)
      readability.ts(10)
      skills.ts    (15)
      experience.ts(15)
      projects.ts  (10)
      education.ts (5)
      compliance.ts(5)
      skillsTaxonomy.ts
    types.ts

supabase/functions/
  ats-analyze/index.ts          # optional AI enrichment (qualitative feedback + rewrites)

new landing section:
  src/components/landing/ATSCheckerSection.tsx   # hero card CTA on /
```

## Scoring engine (deterministic, 100 pts)

Each check returns `{ score, max, passed[], failed[], suggestions[] }` so every point is traceable. Weights match the spec: Contact 10, Sections 15, Formatting 15, Readability 10, Skills 15, Experience 15, Projects 10, Education 5, Compliance 5.

Techniques:
- **Contact**: regex for email, phone (intl), LinkedIn/GitHub/portfolio URLs, location heuristic.
- **Sections**: keyword header detection (Summary, Skills, Experience, Projects, Education, Certifications, Achievements, Languages).
- **Formatting**: from PDF structure — column count via pdfjs text-item x-positions, image count, table detection, font-size distribution, bullet consistency. DOCX: mammoth warnings + tag inspection.
- **Readability**: sentence length, passive-voice regex, weak-verb list, buzzword frequency, repeated phrases (n-gram).
- **Skills**: match against curated taxonomy (Programming/Frameworks/Cloud/DB/Tools/AI-ML/Data/Soft).
- **Experience**: action-verb list, quantified metrics regex (`\d+%|\$\d+|\d+\+`), bullet strength.
- **Projects**: title/desc/tech/GitHub-link/impact detection.
- **Education**: degree + institute + year regex.
- **Compliance**: length (300–1200 words ideal), section order sanity, professionalism heuristics.

## AI enrichment (edge function)

`ats-analyze` takes extracted text + deterministic findings, returns:
- Rewritten bullet suggestions (before/after) for weak experience lines.
- Recruiter-impression paragraph.
- Prioritized top-5 recommendations.

Uses `google/gemini-3-flash-preview` via Lovable AI Gateway with structured output (Zod schema, capped/clamped in code — no schema length bounds). Graceful fallback: if AI fails, the deterministic report still renders fully.

## Upload & extraction (client-side)

- `react-dropzone` for drag/drop.
- Client-side extraction to keep it snappy and to avoid uploading rejected files:
  - PDF: `pdfjs-dist` (also gives layout metrics for formatting checks).
  - DOCX: `mammoth` (raw text + messages).
- Validation: MIME + extension, ≤10MB, encrypted PDF detection (pdfjs throws PasswordException), corruption catch.
- Processing stages animated via Framer Motion; each stage resolves as its promise completes.

## Database (Lovable Cloud / Supabase)

New table `resume_analyses` — only used when the user is logged in; anonymous users get results in-memory only.

```
resume_analyses
  id uuid pk
  user_id uuid -> auth.users
  file_name text
  file_size int
  overall_score int
  category_scores jsonb   -- { contact: {score,max}, ... }
  strengths text[]
  warnings text[]
  suggestions jsonb       -- [{before, after, section}]
  ai_summary text
  resume_text text        -- extracted plaintext (for future re-analysis)
  created_at timestamptz
```

RLS: users can only read/insert/delete their own rows. GRANTs to authenticated + service_role. Optionally store the original file in a private `resumes-ats` bucket (owner-scoped path `${user_id}/${uuid}.pdf`).

## PDF report

Client-side generation with `jspdf` + `html2canvas` from a hidden print-styled component. Includes: cover with Instruvex logo, score dial, category chart, strengths/warnings, section analysis, suggestions, footer branding.

## Routing & entry points

- Add `/ats-checker` public route in `src/App.tsx`.
- Add `ATSCheckerSection` above the existing hero/products stack on the landing page (`src/pages/Index.tsx`) with the specified title/subtitle and CTA.
- Add `/dashboard/resume-history` (authenticated) with a sidebar link in `DashboardLayout` visible to all roles.

## Design tokens

Reuse existing tokens (`--steel`, `--card-gradient`, `--hero`, `--shadow-card`). No hardcoded colors. Framer Motion for stage transitions, score count-up, and bar fills. Glassmorphism card on hero. Fully responsive (mobile stacks category bars, keeps circular score centered).

## Accessibility & performance

- Keyboard-accessible dropzone + focus rings.
- ARIA live region announces stage progress and final score.
- Lazy-load `pdfjs-dist`, `mammoth`, `jspdf`, `html2canvas` via dynamic `import()` so the landing page stays light.
- Score computation runs in a `requestIdleCallback` chunked loop for very large resumes.

## Deliverables (implementation order)

1. Migration: `resume_analyses` table + RLS + private storage bucket.
2. Install deps: `pdfjs-dist`, `mammoth`, `react-dropzone`, `jspdf`, `html2canvas`.
3. Scoring library + skills taxonomy + types.
4. Client extraction module.
5. UI primitives (ScoreCircle, CategoryBar, SectionCard, SuggestionCard, KeywordCloud, ProcessingStages, ResumeUploader).
6. `/ats-checker` page composing everything + PDF export.
7. Edge function `ats-analyze` for AI enrichment.
8. Landing section + route wiring.
9. Dashboard history page + sidebar link.
10. Verification pass: build, lint, quick Playwright smoke of the upload flow with a sample PDF.

## Out of scope for this iteration (kept modular for later)

Resume Builder, JD matching, full rewrite/cover-letter generation, interview prep — components and types are designed so those slot in without refactors.
