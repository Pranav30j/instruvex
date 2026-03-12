
-- Institutes table
CREATE TABLE public.institutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  logo_url text,
  email text,
  phone text,
  address text,
  website text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all institutes" ON public.institutes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Institute admins manage own institute" ON public.institutes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'institute_admin'
        AND institute_id = institutes.id
    )
  );

CREATE POLICY "Authenticated users can view institutes" ON public.institutes
  FOR SELECT TO authenticated
  USING (true);

-- Departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  head_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(institute_id, code)
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all departments" ON public.departments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Institute admins manage own departments" ON public.departments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'institute_admin'
        AND institute_id = departments.institute_id
    )
  );

CREATE POLICY "Authenticated users can view departments" ON public.departments
  FOR SELECT TO authenticated
  USING (true);

-- Batches table
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  year integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all batches" ON public.batches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Institute admins manage own batches" ON public.batches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.departments d ON d.institute_id = ur.institute_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'institute_admin'
        AND d.id = batches.department_id
    )
  );

CREATE POLICY "Authenticated users can view batches" ON public.batches
  FOR SELECT TO authenticated
  USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_institutes_updated_at BEFORE UPDATE ON public.institutes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
