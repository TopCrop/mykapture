-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (org_id, email)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view invitations in org" ON public.invitations
  FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Admins create invitations" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins delete invitations" ON public.invitations
  FOR DELETE TO authenticated
  USING (
    org_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Super admins manage all invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

-- Update handle_new_user to check invitations first
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _domain text;
  _org_id uuid;
BEGIN
  -- First check for pending invitation
  SELECT inv.org_id INTO _org_id FROM public.invitations inv
    WHERE lower(inv.email) = lower(NEW.email) AND inv.status = 'pending' AND inv.expires_at > now()
    LIMIT 1;

  -- If invitation found, mark as accepted
  IF _org_id IS NOT NULL THEN
    UPDATE public.invitations SET status = 'accepted' WHERE lower(email) = lower(NEW.email) AND org_id = _org_id AND status = 'pending';
  ELSE
    -- Fall back to domain matching
    _domain := split_part(NEW.email, '@', 2);
    SELECT id INTO _org_id FROM public.organizations WHERE domain = _domain LIMIT 1;
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
    INSERT INTO public.org_members (org_id, user_id) VALUES (_org_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$function$;