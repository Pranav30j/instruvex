
-- Assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.academy_courses(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  max_marks NUMERIC,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  files TEXT[] DEFAULT '{}',
  links TEXT[] DEFAULT '{}',
  text_response TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marks_awarded NUMERIC,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Assignments RLS
CREATE POLICY "Creators manage own assignments" ON public.assignments
  FOR ALL TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Super admins manage all assignments" ON public.assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view published assignments" ON public.assignments
  FOR SELECT TO authenticated
  USING (status = 'published');

-- Submissions RLS
CREATE POLICY "Students manage own submissions" ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Assignment creators view submissions" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments
    WHERE assignments.id = assignment_submissions.assignment_id
    AND assignments.created_by = auth.uid()
  ));

CREATE POLICY "Super admins manage all submissions" ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);

-- Storage policies
CREATE POLICY "Authenticated users upload assignment files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignment-files');

CREATE POLICY "Authenticated users view assignment files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'assignment-files');

CREATE POLICY "Users delete own assignment files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'assignment-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Updated_at trigger
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
