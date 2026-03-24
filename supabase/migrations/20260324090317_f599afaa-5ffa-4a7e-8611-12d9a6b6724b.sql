
-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  thumbnail_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Instruvex Team',
  author_id UUID,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT TO public USING (is_published = true);

CREATE POLICY "Admins manage all blog posts" ON public.blog_posts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Institute admins manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'institute_admin'::app_role));

-- Contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins view contact submissions" ON public.contact_submissions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Job listings
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Remote',
  type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT,
  requirements TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active job listings" ON public.job_listings
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins manage job listings" ON public.job_listings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Job applications
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_url TEXT,
  linkedin_url TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit job applications" ON public.job_applications
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins view job applications" ON public.job_applications
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
