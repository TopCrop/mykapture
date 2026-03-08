
-- 1. Update leads SELECT policy: users see only their own leads, admins/managers see all
DROP POLICY IF EXISTS "Users can view all leads" ON public.leads;
CREATE POLICY "Users can view own leads or admins/managers see all"
ON public.leads FOR SELECT
TO authenticated
USING (
  auth.uid() = captured_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- 2. Create a security definer function to check for duplicate leads within an event
-- This needs to see ALL leads regardless of RLS
CREATE OR REPLACE FUNCTION public.check_duplicate_lead(
  _email text,
  _phone text,
  _event_id uuid,
  _current_user_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'is_duplicate', true,
        'is_own', captured_by = _current_user_id,
        'lead_id', id,
        'lead_name', name,
        'captured_by_name', (
          SELECT display_name FROM public.profiles WHERE user_id = captured_by LIMIT 1
        )
      )
      FROM public.leads
      WHERE event_id = _event_id
        AND (
          (_email IS NOT NULL AND _email <> '' AND lower(email) = lower(_email))
          OR (_phone IS NOT NULL AND _phone <> '' AND phone = _phone)
        )
      LIMIT 1
    ),
    '{"is_duplicate": false}'::jsonb
  )
$$;
