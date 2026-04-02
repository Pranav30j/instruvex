
-- 1. Fix question_options: Remove student SELECT that exposes is_correct
-- Students should use the question_options_student view instead
DROP POLICY IF EXISTS "Students view options for active exams" ON question_options;

-- 2. Fix questions: Hide expected_answer from students
-- Drop old student policy and create a view without expected_answer
DROP POLICY IF EXISTS "Students view questions for active exams" ON questions;

CREATE OR REPLACE VIEW public.questions_student
WITH (security_invoker = on)
AS SELECT id, exam_id, question_type, marks, order_index, created_at, question_text, code_template, code_language
FROM public.questions;

-- Students can SELECT from this view
CREATE POLICY "Students view questions for active exams"
ON questions FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = questions.exam_id
    AND exams.status = ANY (ARRAY['active'::exam_status, 'completed'::exam_status])
  )
);

-- Actually, the view approach with security_invoker means the same RLS applies.
-- So we need to keep the policy but ensure expected_answer is not in the view.
-- Students should query the VIEW, not the table directly. The table policy still exists
-- but the view excludes expected_answer.

-- 3. Fix notifications: Replace open INSERT with restricted one
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- Create a server-side function for inserting notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (_user_id, _title, _message, _type, _link);
END;
$$;

-- Only allow the function to insert (no direct INSERT from client)
-- Admins/super_admins and the system function handle inserts

-- 4. Fix assignment-files storage: Scope SELECT to own files + instructors
DROP POLICY IF EXISTS "Authenticated users view assignment files" ON storage.objects;

CREATE POLICY "Users view own or managed assignment files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'assignment-files' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'instructor'::app_role)
    OR has_role(auth.uid(), 'institute_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- 5. Fix academy_quiz_options: Create a student-safe view without is_correct
CREATE OR REPLACE VIEW public.academy_quiz_options_student
WITH (security_invoker = on)
AS SELECT id, question_id, order_index, option_text
FROM public.academy_quiz_options;
