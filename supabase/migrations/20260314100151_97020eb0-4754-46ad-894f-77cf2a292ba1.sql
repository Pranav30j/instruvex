
-- Academy courses
CREATE TABLE public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  instructor_name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'beginner',
  thumbnail_url text,
  duration_estimate text,
  learning_outcomes text[],
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Academy modules
CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Academy lectures
CREATE TABLE public.academy_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text,
  description text,
  duration_minutes integer DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Academy notes
CREATE TABLE public.academy_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Academy enrollments
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  payment_status text NOT NULL DEFAULT 'free',
  UNIQUE(user_id, course_id)
);

-- Academy lecture progress
CREATE TABLE public.academy_lecture_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lecture_id uuid NOT NULL REFERENCES public.academy_lectures(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lecture_id)
);

-- Academy certificates
CREATE TABLE public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Updated_at triggers
CREATE TRIGGER update_academy_courses_updated_at BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lecture_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

-- COURSES RLS
CREATE POLICY "Anyone can view published courses" ON public.academy_courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Creators manage own courses" ON public.academy_courses
  FOR ALL TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Super admins manage all courses" ON public.academy_courses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- MODULES RLS
CREATE POLICY "Anyone can view modules of published courses" ON public.academy_modules
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.academy_courses WHERE id = academy_modules.course_id AND is_published = true
  ));

CREATE POLICY "Course creators manage modules" ON public.academy_modules
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.academy_courses WHERE id = academy_modules.course_id AND created_by = auth.uid()
  ));

CREATE POLICY "Super admins manage all modules" ON public.academy_modules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- LECTURES RLS
CREATE POLICY "Anyone can view lectures of published courses" ON public.academy_lectures
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.academy_modules m
    JOIN public.academy_courses c ON c.id = m.course_id
    WHERE m.id = academy_lectures.module_id AND c.is_published = true
  ));

CREATE POLICY "Course creators manage lectures" ON public.academy_lectures
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.academy_modules m
    JOIN public.academy_courses c ON c.id = m.course_id
    WHERE m.id = academy_lectures.module_id AND c.created_by = auth.uid()
  ));

CREATE POLICY "Super admins manage all lectures" ON public.academy_lectures
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- NOTES RLS
CREATE POLICY "Enrolled users can view notes" ON public.academy_notes
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.academy_modules m
    JOIN public.academy_enrollments e ON e.course_id = m.course_id
    WHERE m.id = academy_notes.module_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Course creators manage notes" ON public.academy_notes
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.academy_modules m
    JOIN public.academy_courses c ON c.id = m.course_id
    WHERE m.id = academy_notes.module_id AND c.created_by = auth.uid()
  ));

CREATE POLICY "Super admins manage all notes" ON public.academy_notes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- ENROLLMENTS RLS
CREATE POLICY "Users manage own enrollments" ON public.academy_enrollments
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Course creators view enrollments" ON public.academy_enrollments
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.academy_courses WHERE id = academy_enrollments.course_id AND created_by = auth.uid()
  ));

CREATE POLICY "Super admins manage all enrollments" ON public.academy_enrollments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- LECTURE PROGRESS RLS
CREATE POLICY "Users manage own progress" ON public.academy_lecture_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admins view all progress" ON public.academy_lecture_progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- CERTIFICATES RLS
CREATE POLICY "Users view own certificates" ON public.academy_certificates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificates" ON public.academy_certificates
  FOR SELECT USING (true);

CREATE POLICY "Super admins manage all certificates" ON public.academy_certificates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- Storage bucket for course content
INSERT INTO storage.buckets (id, name, public) VALUES ('academy-content', 'academy-content', true);

CREATE POLICY "Authenticated users can upload academy content" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'academy-content');

CREATE POLICY "Anyone can view academy content" ON storage.objects
  FOR SELECT USING (bucket_id = 'academy-content');

CREATE POLICY "Uploaders can update academy content" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'academy-content');

CREATE POLICY "Uploaders can delete academy content" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'academy-content');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_lecture_progress;
