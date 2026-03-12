
-- Create org_solution_options table
CREATE TABLE public.org_solution_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_solution_options ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's options
CREATE POLICY "Members can view org solution options"
  ON public.org_solution_options
  FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Admin/manager can insert
CREATE POLICY "Admins managers can create solution options"
  ON public.org_solution_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')))
    OR is_super_admin(auth.uid())
  );

-- Admin/manager can update
CREATE POLICY "Admins managers can update solution options"
  ON public.org_solution_options
  FOR UPDATE
  TO authenticated
  USING (
    (org_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')))
    OR is_super_admin(auth.uid())
  );

-- Admin/manager can delete
CREATE POLICY "Admins managers can delete solution options"
  ON public.org_solution_options
  FOR DELETE
  TO authenticated
  USING (
    (org_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')))
    OR is_super_admin(auth.uid())
  );
