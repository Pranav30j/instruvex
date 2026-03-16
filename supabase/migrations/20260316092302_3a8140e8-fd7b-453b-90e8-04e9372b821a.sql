
-- Quiz tables
CREATE TABLE public.academy_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer NOT NULL DEFAULT 70,
  time_limit_minutes integer DEFAULT NULL,
  is_final_exam boolean NOT NULL DEFAULT false,
  shuffle_questions boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  explanation text,
  order_index integer NOT NULL DEFAULT 0,
  marks integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.academy_quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE public.academy_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  total_marks numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY "Anyone can view quizzes of published courses" ON public.academy_quizzes FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM academy_modules m JOIN academy_courses c ON c.id = m.course_id
  WHERE m.id = academy_quizzes.module_id AND c.is_published = true
));
CREATE POLICY "Course creators manage quizzes" ON public.academy_quizzes FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM academy_modules m JOIN academy_courses c ON c.id = m.course_id
  WHERE m.id = academy_quizzes.module_id AND c.created_by = auth.uid()
));
CREATE POLICY "Super admins manage all quizzes" ON public.academy_quizzes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Quiz questions policies
CREATE POLICY "Anyone can view quiz questions of published courses" ON public.academy_quiz_questions FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM academy_quizzes q JOIN academy_modules m ON m.id = q.module_id JOIN academy_courses c ON c.id = m.course_id
  WHERE q.id = academy_quiz_questions.quiz_id AND c.is_published = true
));
CREATE POLICY "Course creators manage quiz questions" ON public.academy_quiz_questions FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM academy_quizzes q JOIN academy_modules m ON m.id = q.module_id JOIN academy_courses c ON c.id = m.course_id
  WHERE q.id = academy_quiz_questions.quiz_id AND c.created_by = auth.uid()
));
CREATE POLICY "Super admins manage all quiz questions" ON public.academy_quiz_questions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Quiz options policies
CREATE POLICY "Anyone can view quiz options of published courses" ON public.academy_quiz_options FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM academy_quiz_questions qq JOIN academy_quizzes q ON q.id = qq.quiz_id JOIN academy_modules m ON m.id = q.module_id JOIN academy_courses c ON c.id = m.course_id
  WHERE qq.id = academy_quiz_options.question_id AND c.is_published = true
));
CREATE POLICY "Course creators manage quiz options" ON public.academy_quiz_options FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM academy_quiz_questions qq JOIN academy_quizzes q ON q.id = qq.quiz_id JOIN academy_modules m ON m.id = q.module_id JOIN academy_courses c ON c.id = m.course_id
  WHERE qq.id = academy_quiz_options.question_id AND c.created_by = auth.uid()
));
CREATE POLICY "Super admins manage all quiz options" ON public.academy_quiz_options FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Quiz attempts policies
CREATE POLICY "Users manage own quiz attempts" ON public.academy_quiz_attempts FOR ALL TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Course creators view quiz attempts" ON public.academy_quiz_attempts FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM academy_quizzes q JOIN academy_modules m ON m.id = q.module_id JOIN academy_courses c ON c.id = m.course_id
  WHERE q.id = academy_quiz_attempts.quiz_id AND c.created_by = auth.uid()
));
CREATE POLICY "Super admins manage all quiz attempts" ON public.academy_quiz_attempts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
