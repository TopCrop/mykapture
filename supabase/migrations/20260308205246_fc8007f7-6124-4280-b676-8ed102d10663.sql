
-- RLS for organizations
CREATE POLICY "Super admins can manage all orgs"
  ON public.organizations FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own org"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_org_id(auth.uid()));

-- RLS for org_members
CREATE POLICY "Super admins can manage all members"
  ON public.org_members FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view members in their org"
  ON public.org_members FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()));

-- Drop old events RLS
DROP POLICY IF EXISTS "Admins and managers can manage events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;

CREATE POLICY "Users can view events in their org"
  ON public.events FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can create events in their org"
  ON public.events FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins managers update events in org"
  ON public.events FOR UPDATE
  USING (
    org_id = public.get_user_org_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins can delete events in org"
  ON public.events FOR DELETE
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins manage all events"
  ON public.events FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Drop old leads RLS
DROP POLICY IF EXISTS "Users can view own leads or admins/managers see all" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

CREATE POLICY "Users view leads in org"
  ON public.leads FOR SELECT
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      auth.uid() = captured_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
    ))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Users create leads in org"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = captured_by AND org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users update leads in org"
  ON public.leads FOR UPDATE
  USING (
    org_id = public.get_user_org_id(auth.uid())
    AND (auth.uid() = captured_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins delete leads in org"
  ON public.leads FOR DELETE
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Drop old follow_up_bookings RLS
DROP POLICY IF EXISTS "Users can view all bookings" ON public.follow_up_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.follow_up_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.follow_up_bookings;

CREATE POLICY "Users view bookings in org"
  ON public.follow_up_bookings FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users create bookings in org"
  ON public.follow_up_bookings FOR INSERT
  WITH CHECK (auth.uid() = booked_by AND org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users update bookings in org"
  ON public.follow_up_bookings FOR UPDATE
  USING (
    org_id = public.get_user_org_id(auth.uid())
    AND (auth.uid() = booked_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- Drop old profiles RLS
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users view profiles in org"
  ON public.profiles FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Update handle_new_user to auto-assign org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _domain text;
  _org_id uuid;
BEGIN
  _domain := split_part(NEW.email, '@', 2);
  SELECT id INTO _org_id FROM public.organizations WHERE domain = _domain LIMIT 1;
  
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
$$;
