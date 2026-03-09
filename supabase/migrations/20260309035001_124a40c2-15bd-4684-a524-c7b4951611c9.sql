DROP FUNCTION IF EXISTS public.get_all_org_stats();

CREATE OR REPLACE FUNCTION public.get_all_org_stats()
RETURNS TABLE(org_id uuid, org_name text, org_domain text, org_created_at timestamp with time zone, member_count bigint, lead_count bigint, org_status text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  RETURN QUERY
  SELECT
    o.id AS org_id,
    o.name AS org_name,
    o.domain AS org_domain,
    o.created_at AS org_created_at,
    COALESCE(m.cnt, 0) AS member_count,
    COALESCE(l.cnt, 0) AS lead_count,
    o.status AS org_status
  FROM public.organizations o
  LEFT JOIN (
    SELECT om.org_id, count(*) AS cnt FROM public.org_members om GROUP BY om.org_id
  ) m ON m.org_id = o.id
  LEFT JOIN (
    SELECT ld.org_id, count(*) AS cnt FROM public.leads ld GROUP BY ld.org_id
  ) l ON l.org_id = o.id
  ORDER BY
    CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END,
    o.created_at DESC;
END;
$$;