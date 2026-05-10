
-- Job posts table
CREATE TABLE public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'Instruvex',
  type TEXT NOT NULL DEFAULT 'job' CHECK (type IN ('job','internship')),
  location TEXT,
  work_mode TEXT NOT NULL DEFAULT 'remote' CHECK (work_mode IN ('remote','onsite','hybrid')),
  salary TEXT,
  duration TEXT,
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT,
  skills_required TEXT[] DEFAULT '{}',
  posted_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active job posts"
  ON public.job_posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Posters manage own job posts"
  ON public.job_posts FOR ALL
  TO authenticated
  USING (auth.uid() = posted_by)
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Admins manage all job posts"
  ON public.job_posts FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'institute_admin'::app_role)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'institute_admin'::app_role)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
  );

CREATE TRIGGER trg_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  portfolio_link TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','rejected','selected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Job posters view applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = applications.job_id AND j.posted_by = auth.uid()));

CREATE POLICY "Job posters update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.job_posts j WHERE j.id = applications.job_id AND j.posted_by = auth.uid()));

CREATE POLICY "Super admins manage all applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Resumes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Job posters read applicant resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.job_posts j ON j.id = a.job_id
      WHERE a.resume_url LIKE '%' || name AND j.posted_by = auth.uid()
    )
  );

CREATE POLICY "Super admins read all resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'super_admin'::app_role));
