-- Prevent deleting the last super_admin role
CREATE OR REPLACE FUNCTION public.prevent_last_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'super_admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'super_admin' AND user_id != OLD.user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last super_admin. At least one super_admin must exist.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_last_super_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_super_admin();

-- Allow institute_admin to manage roles within their institute
CREATE POLICY "Institute admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'institute_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'institute_admin'::app_role)
    AND role NOT IN ('super_admin')
  );

-- Allow institute_admin to view all profiles for role management
CREATE POLICY "Institute admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'institute_admin'::app_role));