
DROP POLICY IF EXISTS "Users create leads in org" ON public.leads;
CREATE POLICY "Users create leads in org"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = captured_by AND org_id = get_user_org_id(auth.uid()))
    OR is_super_admin(auth.uid())
  );
