CREATE OR REPLACE FUNCTION public.admin_approve_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target_org_id uuid;
  _caller_org_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorised';
  END IF;

  IF NOT public.is_super_admin(auth.uid()) THEN
    SELECT org_id INTO _target_org_id FROM public.profiles WHERE user_id = _user_id;
    SELECT public.get_user_org_id(auth.uid()) INTO _caller_org_id;
    IF _target_org_id IS NULL OR _target_org_id <> _caller_org_id THEN
      RAISE EXCEPTION 'Cannot approve users outside your organization';
    END IF;
  END IF;

  UPDATE public.profiles
  SET manually_approved_by = auth.uid(),
      manually_approved_at = now(),
      email_confirmed = true
  WHERE user_id = _user_id;

  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = _user_id
    AND email_confirmed_at IS NULL;
END;
$$;