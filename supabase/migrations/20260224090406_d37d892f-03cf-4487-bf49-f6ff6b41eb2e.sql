
-- Question type enum
CREATE TYPE public.question_type AS ENUM ('mcq', 'subjective', 'coding');

-- Exam status enum
CREATE TYPE public.exam_status AS ENUM ('draft', 'published', 'active', 'completed', 'archived');

-- Submission status enum
CREATE TYPE public.submission_status AS ENUM ('in_progress', 'submitted', 'graded');

-- Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  institute_id UUID,
  status public.exam_status NOT NULL DEFAULT 'draft',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks NUMERIC NOT NULL DEFAULT 0,
  passing_marks NUMERIC NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  show_results BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_type public.question_type NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  marks NUMERIC NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  -- For coding questions
  code_template TEXT,
  code_language TEXT,
  -- For subjective
  expected_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- MCQ options table
CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

-- Exam submissions table
CREATE TABLE public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status public.submission_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  total_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- Student answers table
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id),
  text_answer TEXT,
  code_answer TEXT,
  marks_awarded NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_student_answers_updated_at BEFORE UPDATE ON public.student_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for exams
CREATE POLICY "Creators can manage own exams" ON public.exams FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Students can view published exams" ON public.exams FOR SELECT USING (status IN ('published', 'active', 'completed'));
CREATE POLICY "Super admins manage all exams" ON public.exams FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS for questions (inherit from exam access)
CREATE POLICY "Exam creators manage questions" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND created_by = auth.uid())
);
CREATE POLICY "Students view questions for active exams" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND status IN ('active', 'completed'))
);
CREATE POLICY "Super admins manage all questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS for question_options
CREATE POLICY "Exam creators manage options" ON public.question_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.questions q JOIN public.exams e ON e.id = q.exam_id WHERE q.id = question_id AND e.created_by = auth.uid())
);
CREATE POLICY "Students view options for active exams" ON public.question_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.questions q JOIN public.exams e ON e.id = q.exam_id WHERE q.id = question_id AND e.status IN ('active', 'completed'))
);
CREATE POLICY "Super admins manage all options" ON public.question_options FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS for exam_submissions
CREATE POLICY "Students manage own submissions" ON public.exam_submissions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Exam creators view submissions" ON public.exam_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND created_by = auth.uid())
);
CREATE POLICY "Super admins manage all submissions" ON public.exam_submissions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS for student_answers
CREATE POLICY "Students manage own answers" ON public.student_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exam_submissions WHERE id = submission_id AND student_id = auth.uid())
);
CREATE POLICY "Exam creators view answers" ON public.student_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exam_submissions es JOIN public.exams e ON e.id = es.exam_id WHERE es.id = submission_id AND e.created_by = auth.uid())
);
CREATE POLICY "Super admins manage all answers" ON public.student_answers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
