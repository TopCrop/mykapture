
-- Create organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create org_members join table
CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Add org_id to existing tables
ALTER TABLE public.events ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.leads ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.follow_up_bookings ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN org_id uuid REFERENCES public.organizations(id);

-- Helper: get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.org_members WHERE user_id = _user_id LIMIT 1
$$;

-- Helper: check if user is super_admin (uses text cast to avoid enum issue)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'super_admin'
  )
$$;

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
