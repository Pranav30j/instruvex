
-- Subjects table
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage all subjects" ON public.subjects FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Institute admins manage subjects" ON public.subjects FOR ALL TO authenticated USING (has_role(auth.uid(), 'institute_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'institute_admin'::app_role));
CREATE POLICY "Creators manage own subjects" ON public.subjects FOR ALL TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Class-Subject mapping (links batch + subject + instructor)
CREATE TABLE public.class_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, subject_id)
);
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view class_subjects" ON public.class_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage all class_subjects" ON public.class_subjects FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Institute admins manage class_subjects" ON public.class_subjects FOR ALL TO authenticated USING (has_role(auth.uid(), 'institute_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'institute_admin'::app_role));
CREATE POLICY "Instructors manage own class_subjects" ON public.class_subjects FOR ALL TO authenticated USING (auth.uid() = instructor_id) WITH CHECK (auth.uid() = instructor_id);

-- Class-Student mapping
CREATE TABLE public.class_students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  roll_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, student_id)
);
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own class membership" ON public.class_students FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Instructors view class students" ON public.class_students FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.batch_id = class_students.batch_id AND cs.instructor_id = auth.uid())
);
CREATE POLICY "Super admins manage all class_students" ON public.class_students FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Institute admins manage class_students" ON public.class_students FOR ALL TO authenticated USING (has_role(auth.uid(), 'institute_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'institute_admin'::app_role));

-- Attendance records
CREATE TABLE public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  lecture_number integer DEFAULT 1,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  marked_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, batch_id, subject_id, date, lecture_number)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own attendance" ON public.attendance_records FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Instructors manage attendance for assigned classes" ON public.attendance_records FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.batch_id = attendance_records.batch_id AND cs.subject_id = attendance_records.subject_id AND cs.instructor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.batch_id = attendance_records.batch_id AND cs.subject_id = attendance_records.subject_id AND cs.instructor_id = auth.uid()));
CREATE POLICY "Super admins manage all attendance" ON public.attendance_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Institute admins manage all attendance" ON public.attendance_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'institute_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'institute_admin'::app_role));

-- Indexes
CREATE INDEX idx_attendance_student ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_batch_date ON public.attendance_records(batch_id, date);
CREATE INDEX idx_attendance_subject ON public.attendance_records(subject_id);
CREATE INDEX idx_class_students_batch ON public.class_students(batch_id);

-- Update triggers
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
