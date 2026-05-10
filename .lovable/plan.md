## Careers Module — Full Implementation Plan

Build a complete careers/jobs system with admin management, public listings, applications, and student tracking.

### 1. Database (migration)

**New table: `job_posts`**
- title, company_name (default 'Instruvex'), type ('job'|'internship'), location, work_mode ('remote'|'onsite'|'hybrid'), salary, duration, description, requirements, skills_required (text[]), posted_by, status ('active'|'closed'), created_at, updated_at

**New table: `applications`**
- job_id, user_id, full_name, email, phone, resume_url, portfolio_link, cover_letter, status ('pending'|'shortlisted'|'rejected'|'selected'), applied_at, updated_at
- UNIQUE (job_id, user_id) to prevent duplicate applications

**New storage bucket: `resumes`** (private) with RLS for owner upload/read + admin/job-owner read.

**RLS policies:**
- `job_posts`: public can SELECT active; super_admin/institute_admin/instructor manage; creators (posted_by) manage own
- `applications`: applicant manages own; job poster + super_admin can view/update status; users can INSERT for themselves

Keep existing `job_listings` / `job_applications` tables intact (used by `/careers` public page already) — but the new module supersedes them. We'll point the existing public `/careers` page at the new `job_posts` table for consistency, and keep `job_applications` untouched (legacy).

Actually — to avoid breakage, replace the existing `Careers.tsx` content to use `job_posts` + new applications flow.

### 2. Routes (App.tsx)

Public:
- `/careers` — list active jobs (replace existing page)
- `/careers/:id` — job detail + apply

Protected (sidebar item "Careers"):
- `/dashboard/careers/manage` — admin/instructor: list, create, edit, delete jobs
- `/dashboard/careers/applications` — admin/instructor: view/manage applicants
- `/dashboard/careers/my-applications` — student: track own applications

Allowed roles for manage/applications: `super_admin`, `institute_admin`, `instructor`.

### 3. Pages to build

- `src/pages/Careers.tsx` (rewrite) — public list with filters (type, work_mode)
- `src/pages/CareerDetail.tsx` — detail + apply dialog (resume upload to storage)
- `src/pages/dashboard/CareersManage.tsx` — admin CRUD with create/edit dialog
- `src/pages/dashboard/CareersApplications.tsx` — applicants list, filter by job, status actions
- `src/pages/dashboard/MyApplications.tsx` — student tracker

### 4. Sidebar

Add "Careers" item to `DashboardLayout` sidebar nav. Show different sub-items based on role.

### 5. Notifications

Use existing `create_notification` RPC:
- On apply → confirm to applicant
- On status change → notify applicant

### 6. UI/Styling

Match existing Instruvex dark metallic navy theme; reuse Card, Button (hero variant), Badge, Dialog, Input, Textarea, Select.

### 7. Security

- RLS enforced server-side
- ProtectedRoute with `allowedRoles` for admin pages
- Resume upload path: `{user_id}/{timestamp}-{filename}` so RLS can scope
- Zod validation on all forms

### Technical notes

- Use `react-query` (already in project) for fetching/caching
- Resume upload via `supabase.storage.from('resumes').upload(...)`, get signed URL for admin viewing
- File size limit 5MB, PDF only client-side check
