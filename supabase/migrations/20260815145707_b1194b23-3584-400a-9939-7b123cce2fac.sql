-- Phase 3: academic structure + institution isolation (additive)

-- 1. Helper: institute manage check (super admin or scoped institute admin)
CREATE OR REPLACE FUNCTION public.can_manage_institute(_user_id uuid, _institute_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin'::public.app_role)
      OR public.is_institute_admin_for(_user_id, _institute_id)
$$;

-- 2. Academic years
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_name_per_institute ON public.academic_years (institute_id, lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_one_current ON public.academic_years (institute_id) WHERE is_current;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution members view academic years"
  ON public.academic_years FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.is_institution_member(auth.uid(), institute_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.institute_id = academic_years.institute_id)
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.institute_id = academic_years.institute_id)
  );
CREATE POLICY "Admins manage academic years"
  ON public.academic_years FOR ALL TO authenticated
  USING (public.can_manage_institute(auth.uid(), institute_id))
  WITH CHECK (public.can_manage_institute(auth.uid(), institute_id));

CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Batches: institution scoping + academic year (derived, non-destructive)
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL;

UPDATE public.batches b SET institute_id = d.institute_id
FROM public.departments d WHERE d.id = b.department_id AND b.institute_id IS DISTINCT FROM d.institute_id;

CREATE OR REPLACE FUNCTION public.sync_batch_institute()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  SELECT d.institute_id INTO NEW.institute_id FROM public.departments d WHERE d.id = NEW.department_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS batches_sync_institute ON public.batches;
CREATE TRIGGER batches_sync_institute BEFORE INSERT OR UPDATE OF department_id ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.sync_batch_institute();

-- 4. Sections
CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id uuid REFERENCES public.institutes(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sections_name_per_batch ON public.sections (batch_id, lower(name));

CREATE OR REPLACE FUNCTION public.sync_section_scope()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  SELECT b.institute_id, b.department_id INTO NEW.institute_id, NEW.department_id
  FROM public.batches b WHERE b.id = NEW.batch_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sections_sync_scope ON public.sections;
CREATE TRIGGER sections_sync_scope BEFORE INSERT OR UPDATE OF batch_id ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.sync_section_scope();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution members view sections"
  ON public.sections FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.is_institution_member(auth.uid(), institute_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.institute_id = sections.institute_id)
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.institute_id = sections.institute_id)
  );
CREATE POLICY "Admins manage sections"
  ON public.sections FOR ALL TO authenticated
  USING (public.can_manage_institute(auth.uid(), institute_id))
  WITH CHECK (public.can_manage_institute(auth.uid(), institute_id));

-- 5. Subjects: optional institution scoping (legacy global subjects preserved)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL;

-- Replace the unscoped institute-admin policy with an institution-scoped one
DROP POLICY IF EXISTS "Institute admins manage subjects" ON public.subjects;
CREATE POLICY "Institute admins manage own institute subjects"
  ON public.subjects FOR ALL TO authenticated
  USING (institute_id IS NOT NULL AND public.is_institute_admin_for(auth.uid(), institute_id))
  WITH CHECK (institute_id IS NOT NULL AND public.is_institute_admin_for(auth.uid(), institute_id));

-- 6. Student academic placement (non-destructive, nullable)
ALTER TABLE public.class_students ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL;
ALTER TABLE public.class_students ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL;

-- 7. Instructor academic association (reuses existing instructor role + profiles)
CREATE TABLE IF NOT EXISTS public.instructor_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institute_id, department_id, instructor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructor_departments TO authenticated;
GRANT ALL ON public.instructor_departments TO service_role;
ALTER TABLE public.instructor_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own department links"
  ON public.instructor_departments FOR SELECT TO authenticated
  USING (instructor_id = auth.uid() OR public.can_manage_institute(auth.uid(), institute_id));
CREATE POLICY "Admins manage instructor department links"
  ON public.instructor_departments FOR ALL TO authenticated
  USING (public.can_manage_institute(auth.uid(), institute_id))
  WITH CHECK (public.can_manage_institute(auth.uid(), institute_id));

CREATE INDEX IF NOT EXISTS idx_batches_institute ON public.batches(institute_id);
CREATE INDEX IF NOT EXISTS idx_sections_batch ON public.sections(batch_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_institute ON public.academic_years(institute_id);