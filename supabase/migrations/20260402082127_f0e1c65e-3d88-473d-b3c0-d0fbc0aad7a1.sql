
-- 1. FIX: Exam answers exposure - create a secure view without is_correct
CREATE OR REPLACE VIEW public.question_options_student AS
SELECT id, question_id, option_text, order_index
FROM public.question_options;

-- Grant access to the view
GRANT SELECT ON public.question_options_student TO anon, authenticated;

-- 2. FIX: Storage - add owner checks to academy-content DELETE and UPDATE policies
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Uploaders can delete academy content" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders can update academy content" ON storage.objects;

-- Create new policies with owner checks
CREATE POLICY "Owners can delete own academy content"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'academy-content'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Owners can update own academy content"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'academy-content'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
);

-- 3. FIX: Institute admin cross-institute role management
DROP POLICY IF EXISTS "Institute admins can manage roles" ON public.user_roles;

CREATE POLICY "Institute admins can manage roles in own institute"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'institute_admin'
      AND ur.institute_id IS NOT NULL
      AND ur.institute_id = user_roles.institute_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'institute_admin'
      AND ur.institute_id IS NOT NULL
      AND ur.institute_id = user_roles.institute_id
  )
  AND role <> 'super_admin'
);

-- 4. FIX: Institute data exposure - restrict to relevant users
DROP POLICY IF EXISTS "Authenticated users can view institutes" ON public.institutes;

CREATE POLICY "Users can view own institute"
ON public.institutes
FOR SELECT
TO authenticated
USING (
  -- User belongs to this institute
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.institute_id = institutes.id
  )
  -- Or is super_admin
  OR public.has_role(auth.uid(), 'super_admin')
  -- Or is the creator
  OR auth.uid() = created_by
);
