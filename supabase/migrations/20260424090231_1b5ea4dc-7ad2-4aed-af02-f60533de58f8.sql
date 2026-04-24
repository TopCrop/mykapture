-- Add columns for tracking manual approval / email confirmation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS manually_approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS manually_approved_at timestamptz;

-- Function for admin to manually approve a user (confirms their email)
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
  -- Only allow admins/super admins to call this
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorised';
  END IF;

  -- If not super admin, ensure target user is in the same org
  IF NOT public.is_super_admin(auth.uid()) THEN
    SELECT org_id INTO _target_org_id FROM public.profiles WHERE user_id = _user_id;
    SELECT public.get_user_org_id(auth.uid()) INTO _caller_org_id;
    IF _target_org_id IS NULL OR _target_org_id <> _caller_org_id THEN
      RAISE EXCEPTION 'Cannot approve users outside your organization';
    END IF;
  END IF;

  -- Mark as manually approved in profiles
  UPDATE public.profiles
  SET
    manually_approved_by = auth.uid(),
    manually_approved_at = now(),
    email_confirmed = true
  WHERE user_id = _user_id;

  -- Confirm the user's email in auth.users
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmed_at = COALESCE(confirmed_at, now())
  WHERE id = _user_id
    AND email_confirmed_at IS NULL;
END;
$$;

-- RLS: admins of same org (or super admins) can see pending users in their org
CREATE POLICY "Admins can view pending users in their org"
  ON public.profiles FOR SELECT
  USING (
    (org_id = public.get_user_org_id(auth.uid())
     AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')))
    OR public.is_super_admin(auth.uid())
  );