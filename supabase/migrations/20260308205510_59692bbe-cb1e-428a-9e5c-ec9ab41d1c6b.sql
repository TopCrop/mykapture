
-- Allow all org members to create events (not just admin/manager)
DROP POLICY IF EXISTS "Users can create events in their org" ON public.events;
CREATE POLICY "Users can create events in their org"
  ON public.events FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()));
