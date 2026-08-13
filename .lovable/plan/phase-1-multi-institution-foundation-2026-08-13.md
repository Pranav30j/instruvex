# Phase 1: Multi-Institution Foundation

Architecture and data foundation only. No UI redesign, no feature migration, nothing removed.

## What already exists (verified)

- Table `institutes` (not `institutions`): id, name, code, logo_url, email, phone, address, website, created_by, timestamps — with RLS for super admins, institute admins, and members.
- `profiles.institute_id` and `user_roles.institute_id` already carry institution assignment.
- Helper functions `has_role`, `is_institute_admin_for` already exist and are used by policies.
- No membership table exists yet.

Decision: keep `institutes` as the institution entity and extend it. Creating a second `institutions` table would fork the data model.

## Database changes (one migration, additive only)

**1. Extend `institutes`**
- Add `slug text unique` (backfilled from name, uniqueness-safe), `primary_color text`, `status text default 'active'`.
- No columns dropped or renamed. `code` stays as-is.

**2. New `institution_members`**
- Columns: id, `institution_id` -> institutes(id) on delete cascade, `user_id` -> auth.users(id) on delete cascade, `status text default 'active'`, created_at, updated_at.
- Unique constraint on (institution_id, user_id); indexes on both columns; updated_at trigger.

**3. Backfill (non-destructive)**
- Insert one active membership per distinct (institute_id, user_id) found in `user_roles` and in `profiles`, skipping conflicts. Existing columns keep their values and remain the source of truth for all current code.

**4. Helper function**
- `public.is_institution_member(_user_id uuid, _institution_id uuid) returns boolean`, security definer, stable — used by policies to avoid recursion.

## RLS for `institution_members`

Grants: SELECT/INSERT/UPDATE/DELETE to `authenticated`, ALL to `service_role`. No `anon` access.

- Members can read their own membership rows.
- Institute admins can read and manage memberships of their own institution (`is_institute_admin_for`).
- Super admins can do everything.
- No blanket authenticated policies.

Existing policies on `institutes`, `profiles`, and `user_roles` are left untouched; the only addition to `institutes` is an extra SELECT path for members via the new table, added as a new policy rather than editing existing ones.

## Frontend

**New:** `src/contexts/InstitutionContext.tsx`
- Exposes `activeInstitution`, `activeInstitutionId`, `userInstitutions`, `loading`, `refreshInstitutions()`, `switchInstitution(id)`.
- Resolution order: query `institution_members` joined to `institutes` for the signed-in user; super admins additionally get the full institute list so they are never locked out; if the membership query returns nothing, fall back to `profiles.institute_id`.
- Active selection: persisted choice in localStorage if still valid, else the single institution, else the first by name. Cleared on sign-out.
- Renders children immediately — never blocks the app on loading, so no existing route can stall.

**Modified:** `src/App.tsx` — wrap `<Routes>` with `<InstitutionProvider>` inside `AuthProvider`. No other file changes.

Nothing consumes the context yet; existing pages continue reading `institute_id` exactly as they do today.

## Out of scope for this phase

Tenant-scoping of exams/attendance/academy/assignments, institution switcher UI, per-institution module toggles, branding application, invite flows.
