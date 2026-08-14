# Phase 2 — Institution Management + Membership Onboarding

Make the Phase 1 multi-institution foundation usable: a super admin can create/edit institutions, manage their members, and promote a member to institute admin — creating the first real membership records so the architecture can be tested end to end.

## What already exists (verified)

- `institutes` has `slug` (unique where not null), `primary_color`, `status`; 1 row (LILY DEBRIS PUBLIC SCHOOL).
- `institution_members` exists with FKs, unique (institution, user), indexes, `updated_at` trigger — 0 rows today.
- Access rules are already correct: super admins fully manage institutes, memberships and roles; institute admins are scoped to their own institution; regular users only see their own memberships. Super admins can read all profiles and roles.
- `/dashboard/institutions` already exists (`src/pages/Institutions.tsx`) with institute/department/batch CRUD, and is already in the sidebar for super admin and institute admin.
- `InstitutionContext` already reads memberships plus super-admin-wide access, with a legacy `profiles.institute_id` fallback.

Because access rules and schema already cover this phase, **no database migration is needed**. All work is frontend, extending the existing page.

## Scope

### 1. Extend the existing Institutions page (no new route)
Keep the current institute → department → batch accordion intact. Add to each institute row:
- Slug, status badge (Active / Suspended), primary-color swatch, active member count, created date.
- Search already exists by name/code — extend it to also match slug.

### 2. Institute create/edit form additions
Extend the existing dialog with:
- Slug (required, auto-suggested from name, lowercase/dash normalised, uniqueness checked before save with a clear inline message on conflict).
- Primary color (color input + hex text).
- Status select (active / suspended), edit only.
Existing fields (code, email, phone, address, website) are preserved. Suspension only flips `status` — no data or memberships are touched, and super admins keep full access to suspended institutions.

### 3. Members panel per institution
A new `InstitutionMembersDialog` component opened from a "Members" button on each institute:
- Lists members joined to their profile (name, email), showing membership status and their current roles.
- Add member: searchable picker over existing profiles (excluding current members), inserts an `institution_members` row with status `active`.
- Deactivate / reactivate a membership (status flip) and remove a membership.
- Optional "Make institute admin" action per member: inserts `user_roles` row `{ user_id, role: 'institute_admin', institute_id: <same institution> }`, leaving every existing role untouched. Duplicate assignment is detected and reported, not duplicated. A matching "Revoke institute admin" removes only that scoped row.

### 4. Context integration check
After any membership change affecting the signed-in user, call `refreshInstitutions()` from `useInstitution()` so the new institution appears in `userInstitutions` and resolves as `activeInstitution`. No sidebar switcher in this phase.

### 5. Verification
Drive the app as a super admin in a headless browser: create a test institution, confirm duplicate slug is rejected, add an existing user as a member, promote to institute admin, and confirm the membership row and scoped role row exist in the database.

## Out of scope
No migration of exams, attendance, academy, assignments, students or other feature tables to institution scope. No auth or role-system changes. No sidebar institution switcher. No global suspension lockout enforcement (status is stored and surfaced for a later phase).

## Technical notes
- Files modified: `src/pages/Institutions.tsx`.
- Files added: `src/components/institutions/InstitutionMembersDialog.tsx` (and a small member-picker if it keeps the dialog readable).
- Membership + role writes go through the existing authenticated client; existing access rules already restrict them to super admins and scoped institute admins.
- `profiles.institute_id` and `user_roles.institute_id` are read/written only in the existing compatible way — no renames, no backfills.
