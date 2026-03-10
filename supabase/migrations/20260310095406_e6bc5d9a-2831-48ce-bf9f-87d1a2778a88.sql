
CREATE OR REPLACE FUNCTION public.get_my_students(_creator_id uuid)
RETURNS TABLE (
  student_id uuid,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  total_submissions bigint,
  avg_score numeric,
  last_submission_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    es.student_id,
    p.first_name,
    p.last_name,
    p.email,
    p.avatar_url,
    COUNT(es.id) AS total_submissions,
    ROUND(AVG(es.total_score), 1) AS avg_score,
    MAX(es.submitted_at) AS last_submission_at
  FROM exam_submissions es
  JOIN exams e ON e.id = es.exam_id AND e.created_by = _creator_id
  LEFT JOIN profiles p ON p.user_id = es.student_id
  GROUP BY es.student_id, p.first_name, p.last_name, p.email, p.avatar_url
$$;
