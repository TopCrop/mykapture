-- Create org_features table for per-org feature flags
CREATE TABLE public.org_features (
  org_id UUID NOT NULL PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  schedule_follow_up BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.org_features ENABLE ROW LEVEL SECURITY;

-- View: any org member or super admin
CREATE POLICY "Members view org features"
ON public.org_features
FOR SELECT
TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Insert: admins of the org or super admin
CREATE POLICY "Admins insert org features"
ON public.org_features
FOR INSERT
TO authenticated
WITH CHECK (
  (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role))
  OR public.is_super_admin(auth.uid())
);

-- Update: admins of the org or super admin
CREATE POLICY "Admins update org features"
ON public.org_features
FOR UPDATE
TO authenticated
USING (
  (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role))
  OR public.is_super_admin(auth.uid())
)
WITH CHECK (
  (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role))
  OR public.is_super_admin(auth.uid())
);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_org_features_updated_at
BEFORE UPDATE ON public.org_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();