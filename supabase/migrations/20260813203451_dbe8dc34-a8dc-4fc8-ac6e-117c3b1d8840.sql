-- 1. Extend institutes (additive only)
ALTER TABLE public.institutes
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Backfill slugs uniquely from name
WITH base AS (
  SELECT id,
         COALESCE(NULLIF(lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')), ''), 'institute') AS b
  FROM public.institutes
  WHERE slug IS NULL OR slug = ''
), numbered AS (
  SELECT id, b, row_number() OVER (PARTITION BY b ORDER BY id) AS rn FROM base
)
UPDATE public.institutes i
SET slug = CASE WHEN n.rn = 1 THEN n.b ELSE n.b || '-' || n.rn::text END
FROM numbered n
WHERE i.id = n.id;

CREATE UNIQUE INDEX IF NOT EXISTS institutes_slug_key ON public.institutes (slug) WHERE slug IS NOT NULL;

-- 2. Membership table
CREATE TABLE IF NOT EXISTS public.institution_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT institution_members_unique UNIQUE (institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_institution_members_user ON public.institution_members (user_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_institution ON public.institution_members (institution_id);

DROP TRIGGER IF EXISTS update_institution_members_updated_at ON public.institution_members;
CREATE TRIGGER update_institution_members_updated_at
  BEFORE UPDATE ON public.institution_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_members TO authenticated;
GRANT ALL ON public.institution_members TO service_role;

ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;

-- 4. Helper (created before policies that use it)
CREATE OR REPLACE FUNCTION public.is_institution_member(_user_id uuid, _institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE user_id = _user_id
      AND institution_id = _institution_id
      AND status = 'active'
  )
$$;

-- Policies
CREATE POLICY "Users can view own memberships"
  ON public.institution_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Institute admins view memberships of own institution"
  ON public.institution_members FOR SELECT TO authenticated
  USING (public.is_institute_admin_for(auth.uid(), institution_id));

CREATE POLICY "Institute admins insert memberships in own institution"
  ON public.institution_members FOR INSERT TO authenticated
  WITH CHECK (public.is_institute_admin_for(auth.uid(), institution_id));

CREATE POLICY "Institute admins update memberships in own institution"
  ON public.institution_members FOR UPDATE TO authenticated
  USING (public.is_institute_admin_for(auth.uid(), institution_id))
  WITH CHECK (public.is_institute_admin_for(auth.uid(), institution_id));

CREATE POLICY "Institute admins delete memberships in own institution"
  ON public.institution_members FOR DELETE TO authenticated
  USING (public.is_institute_admin_for(auth.uid(), institution_id));

CREATE POLICY "Super admins manage all memberships"
  ON public.institution_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 3. Backfill from existing assignments (non-destructive)
INSERT INTO public.institution_members (institution_id, user_id, status)
SELECT DISTINCT ur.institute_id, ur.user_id, 'active'
FROM public.user_roles ur
WHERE ur.institute_id IS NOT NULL
ON CONFLICT (institution_id, user_id) DO NOTHING;

INSERT INTO public.institution_members (institution_id, user_id, status)
SELECT DISTINCT p.institute_id, p.user_id, 'active'
FROM public.profiles p
WHERE p.institute_id IS NOT NULL
ON CONFLICT (institution_id, user_id) DO NOTHING;

-- Members can view their institution record
CREATE POLICY "Members can view their institution"
  ON public.institutes FOR SELECT TO authenticated
  USING (public.is_institution_member(auth.uid(), id));