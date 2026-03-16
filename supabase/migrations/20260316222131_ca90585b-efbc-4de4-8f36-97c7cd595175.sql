DROP POLICY IF EXISTS "Users create leads in org" ON public.leads;
CREATE POLICY "Users create leads in org" ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = captured_by
  AND org_id = public.get_user_org_id(auth.uid())
  AND (event_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND status = 'completed'
  ))
);