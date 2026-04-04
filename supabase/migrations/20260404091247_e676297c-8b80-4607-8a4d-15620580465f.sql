
-- Secure recovery function: only works server-side via edge function
CREATE OR REPLACE FUNCTION public.recover_super_admin(_user_id uuid, _user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_any_super boolean;
  is_bootstrap boolean;
  result jsonb := '{"action": "none"}'::jsonb;
  r app_role;
BEGIN
  -- Check if any super_admin exists
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE role = 'super_admin') INTO has_any_super;
  
  -- Check if this is the bootstrap admin
  is_bootstrap := (_user_email = 'venusboss681@gmail.com');
  
  -- Case 1: No super_admin exists → promote calling user
  IF NOT has_any_super THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    result := '{"action": "promoted", "reason": "no_super_admin_existed"}'::jsonb;
  END IF;
  
  -- Case 2: Bootstrap admin → ensure all roles
  IF is_bootstrap THEN
    FOREACH r IN ARRAY ARRAY['super_admin', 'institute_admin', 'instructor', 'student', 'academy_learner']::app_role[]
    LOOP
      INSERT INTO user_roles (user_id, role)
      VALUES (_user_id, r)
      ON CONFLICT (user_id, role) DO NOTHING;
    END LOOP;
    result := jsonb_set(result, '{bootstrap}', 'true');
    result := jsonb_set(result, '{action}', '"all_roles_assigned"');
  END IF;
  
  RETURN result;
END;
$$;
