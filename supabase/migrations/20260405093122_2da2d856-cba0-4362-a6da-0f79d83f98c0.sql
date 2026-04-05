
-- Proctoring logs table
CREATE TABLE public.proctoring_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  submission_id uuid REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  tab_switch_count integer NOT NULL DEFAULT 0,
  fullscreen_exit_count integer NOT NULL DEFAULT 0,
  copy_attempts integer NOT NULL DEFAULT 0,
  face_flags integer NOT NULL DEFAULT 0,
  warnings_shown integer NOT NULL DEFAULT 0,
  auto_submitted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);

ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own proctoring log"
  ON public.proctoring_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own proctoring log"
  ON public.proctoring_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Exam creators view proctoring logs"
  ON public.proctoring_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams WHERE exams.id = proctoring_logs.exam_id AND exams.created_by = auth.uid()
    )
  );

CREATE POLICY "Super admins manage all proctoring logs"
  ON public.proctoring_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_proctoring_logs_updated_at
  BEFORE UPDATE ON public.proctoring_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Plagiarism records table
CREATE TABLE public.plagiarism_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  matched_student_id uuid,
  similarity_score numeric NOT NULL DEFAULT 0,
  flagged boolean NOT NULL DEFAULT false,
  detection_method text NOT NULL DEFAULT 'text_similarity',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.plagiarism_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam creators view plagiarism records"
  ON public.plagiarism_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams WHERE exams.id = plagiarism_records.exam_id AND exams.created_by = auth.uid()
    )
  );

CREATE POLICY "Super admins manage all plagiarism records"
  ON public.plagiarism_records FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Students cannot read own log (to prevent gaming)
CREATE POLICY "Students can read own proctoring log for updates"
  ON public.proctoring_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);
