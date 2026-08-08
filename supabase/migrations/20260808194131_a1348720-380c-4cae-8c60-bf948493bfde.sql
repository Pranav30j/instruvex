
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS attempt_limit integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS negative_marking numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS results_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_settings jsonb NOT NULL DEFAULT jsonb_build_object(
    'fullscreen_required', true,
    'tab_switch_detection', true,
    'copy_paste_protection', true,
    'right_click_protection', true,
    'text_selection_protection', true,
    'auto_submit_on_violation', false,
    'max_violations', 3,
    'ai_proctoring', false,
    'camera_required', false,
    'microphone_required', false,
    'allow_answer_review', true
  );

ALTER TABLE public.exam_submissions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_submitted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS integrity_score integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS current_question_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marked_for_review jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS time_spent_seconds integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students insert own security events" ON public.security_events;
CREATE POLICY "Students insert own security events"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students view own security events" ON public.security_events;
CREATE POLICY "Students view own security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Exam creators view security events" ON public.security_events;
CREATE POLICY "Exam creators view security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = security_events.exam_id AND e.created_by = auth.uid()));

DROP POLICY IF EXISTS "Super admins view all security events" ON public.security_events;
CREATE POLICY "Super admins view all security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_security_events_submission ON public.security_events(submission_id);
CREATE INDEX IF NOT EXISTS idx_security_events_exam_student ON public.security_events(exam_id, student_id);

CREATE OR REPLACE FUNCTION public.start_exam_attempt(_exam_id uuid)
RETURNS public.exam_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _exam public.exams;
  _existing public.exam_submissions;
  _used integer;
  _new public.exam_submissions;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _exam FROM public.exams WHERE id = _exam_id;
  IF _exam IS NULL THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;

  IF _exam.status NOT IN ('published'::public.exam_status, 'active'::public.exam_status) THEN
    RAISE EXCEPTION 'This examination is not currently available';
  END IF;

  IF _exam.start_time IS NOT NULL AND now() < _exam.start_time THEN
    RAISE EXCEPTION 'This examination has not started yet';
  END IF;

  IF _exam.end_time IS NOT NULL AND now() > _exam.end_time THEN
    RAISE EXCEPTION 'This examination window has closed';
  END IF;

  -- Resume an active attempt if one exists
  SELECT * INTO _existing
  FROM public.exam_submissions
  WHERE exam_id = _exam_id AND student_id = _uid AND status = 'in_progress'::public.submission_status
  ORDER BY started_at DESC
  LIMIT 1;

  IF _existing.id IS NOT NULL THEN
    IF _existing.expires_at IS NULL THEN
      UPDATE public.exam_submissions
      SET expires_at = _existing.started_at + make_interval(mins => _exam.duration_minutes)
      WHERE id = _existing.id
      RETURNING * INTO _existing;
    END IF;
    RETURN _existing;
  END IF;

  SELECT count(*) INTO _used
  FROM public.exam_submissions
  WHERE exam_id = _exam_id AND student_id = _uid;

  IF _used >= GREATEST(_exam.attempt_limit, 1) THEN
    RAISE EXCEPTION 'Attempt limit reached for this examination';
  END IF;

  INSERT INTO public.exam_submissions (exam_id, student_id, status, started_at, expires_at)
  VALUES (
    _exam_id,
    _uid,
    'in_progress'::public.submission_status,
    now(),
    LEAST(
      now() + make_interval(mins => _exam.duration_minutes),
      COALESCE(_exam.end_time, now() + make_interval(mins => _exam.duration_minutes))
    )
  )
  RETURNING * INTO _new;

  RETURN _new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_exam_attempt(uuid) TO authenticated;
