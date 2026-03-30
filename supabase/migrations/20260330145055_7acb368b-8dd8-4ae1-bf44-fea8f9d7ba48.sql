
-- Fix 1: Allow authenticated users to create pending orgs
CREATE POLICY "Authenticated users can create pending orgs"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (status = 'pending' OR status IS NULL);

-- Fix 2: Update handle_new_user to match pending orgs too
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _domain text;
  _org_id uuid;
BEGIN
  SELECT inv.org_id INTO _org_id
  FROM public.invitations inv
  WHERE lower(inv.email) = lower(NEW.email)
    AND inv.status = 'pending'
    AND inv.expires_at > now()
  LIMIT 1;

  IF _org_id IS NOT NULL THEN
    UPDATE public.invitations SET status = 'accepted'
    WHERE lower(email) = lower(NEW.email)
      AND org_id = _org_id AND status = 'pending';
  ELSE
    _domain := split_part(NEW.email, '@', 2);
    SELECT id INTO _org_id FROM public.organizations
    WHERE domain = _domain
      AND status IN ('approved', 'pending')
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, avatar_url, org_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    _org_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'sales_rep');

  IF _org_id IS NOT NULL THEN
    INSERT INTO public.org_members (org_id, user_id) VALUES (_org_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;
