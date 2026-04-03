-- Add case_study to question_type enum
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'case_study';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'short_answer';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'long_answer';

-- Add new columns to questions table for advanced question types
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS test_cases jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hidden_test_cases jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS input_format text,
  ADD COLUMN IF NOT EXISTS output_format text,
  ADD COLUMN IF NOT EXISTS constraints_text text,
  ADD COLUMN IF NOT EXISTS evaluation_criteria text,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS scenario_text text,
  ADD COLUMN IF NOT EXISTS parent_question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE;

-- Update the questions_student view to include new columns (but still exclude expected_answer)
CREATE OR REPLACE VIEW public.questions_student
WITH (security_invoker = on)
AS SELECT id, exam_id, question_type, marks, order_index, created_at, question_text, 
  code_template, code_language, test_cases, input_format, output_format, constraints_text,
  scenario_text, parent_question_id
FROM public.questions;