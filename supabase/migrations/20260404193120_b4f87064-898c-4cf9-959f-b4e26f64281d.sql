DROP POLICY IF EXISTS "Institute admins can manage roles in own institute" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.is_institute_admin_for(_user_id uuid, _institute_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'institute_admin'::public.app_role
      AND institute_id IS NOT NULL
      AND institute_id = _institute_id
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_institute_admin_for(uuid, uuid) TO authenticated;

CREATE POLICY "Institute admins can view roles in own institute"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_institute_admin_for(auth.uid(), institute_id)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Institute admins can insert roles in own institute"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_institute_admin_for(auth.uid(), institute_id)
  AND role <> 'super_admin'::public.app_role
);

CREATE POLICY "Institute admins can update roles in own institute"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.is_institute_admin_for(auth.uid(), institute_id)
)
WITH CHECK (
  public.is_institute_admin_for(auth.uid(), institute_id)
  AND role <> 'super_admin'::public.app_role
);

CREATE POLICY "Institute admins can delete roles in own institute"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.is_institute_admin_for(auth.uid(), institute_id)
  AND role <> 'super_admin'::public.app_role
);

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.prevent_last_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'super_admin'::public.app_role
     AND (
       TG_OP = 'DELETE'
       OR NEW.role IS DISTINCT FROM 'super_admin'::public.app_role
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
     ) THEN
    IF (
      SELECT COUNT(*)
      FROM public.user_roles
      WHERE role = 'super_admin'::public.app_role
        AND user_id <> OLD.user_id
    ) = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last super_admin. At least one super_admin must exist.';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS protect_last_super_admin ON public.user_roles;
CREATE TRIGGER protect_last_super_admin
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_super_admin();

CREATE OR REPLACE FUNCTION public.recover_super_admin(_user_id uuid, _user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_any_super boolean;
  is_bootstrap boolean;
  result jsonb := '{"action":"none","roles":[]}'::jsonb;
  effective_roles text[];
  r public.app_role;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'::public.app_role
  ) INTO has_any_super;

  is_bootstrap := lower(coalesce(_user_email, '')) = 'venusboss681@gmail.com';

  IF is_bootstrap THEN
    FOREACH r IN ARRAY ARRAY['super_admin', 'institute_admin', 'instructor', 'student', 'academy_learner']::public.app_role[]
    LOOP
      INSERT INTO public.user_roles (user_id, role)
      VALUES (_user_id, r)
      ON CONFLICT (user_id, role) DO NOTHING;
    END LOOP;
    result := jsonb_set(result, '{bootstrap}', 'true'::jsonb, true);
    result := jsonb_set(result, '{action}', '"bootstrap_roles_restored"'::jsonb, true);
  ELSIF NOT has_any_super THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    result := jsonb_set(result, '{action}', '"promoted"'::jsonb, true);
    result := jsonb_set(result, '{reason}', '"no_super_admin_existed"'::jsonb, true);
  END IF;

  SELECT coalesce(array_agg(role::text ORDER BY role::text), ARRAY[]::text[])
  INTO effective_roles
  FROM public.user_roles
  WHERE user_id = _user_id;

  result := jsonb_set(result, '{roles}', to_jsonb(effective_roles), true);
  result := jsonb_set(result, '{has_super_admin_now}', to_jsonb('super_admin' = ANY(effective_roles)), true);

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recover_super_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;