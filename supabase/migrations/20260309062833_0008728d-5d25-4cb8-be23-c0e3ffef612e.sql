-- 1. Trigger: auto-assign unmatched users when org is approved
CREATE OR REPLACE FUNCTION public.assign_unmatched_users_to_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE profiles SET org_id = NEW.id
    WHERE org_id IS NULL
      AND user_id IN (
        SELECT id FROM auth.users
        WHERE split_part(email, '@', 2) = NEW.domain
      );
    INSERT INTO org_members (org_id, user_id)
    SELECT NEW.id, id FROM auth.users
    WHERE split_part(email, '@', 2) = NEW.domain
      AND id NOT IN (SELECT user_id FROM org_members)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_approved
  AFTER UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION assign_unmatched_users_to_org();

-- 2. Login-time fallback RPC
CREATE OR REPLACE FUNCTION public.try_assign_user_to_org()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _domain text;
  _org_id uuid;
  _uid uuid := auth.uid();
BEGIN
  IF EXISTS (SELECT 1 FROM org_members WHERE user_id = _uid) THEN
    RETURN (SELECT org_id FROM org_members WHERE user_id = _uid LIMIT 1);
  END IF;

  SELECT split_part(email, '@', 2) INTO _domain FROM auth.users WHERE id = _uid;
  SELECT id INTO _org_id FROM organizations WHERE domain = _domain AND status = 'approved' LIMIT 1;

  IF _org_id IS NOT NULL THEN
    UPDATE profiles SET org_id = _org_id WHERE user_id = _uid;
    INSERT INTO org_members (org_id, user_id) VALUES (_org_id, _uid) ON CONFLICT DO NOTHING;
    RETURN _org_id;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. Backfill existing unmatched users
UPDATE profiles p SET org_id = o.id
FROM auth.users u, organizations o
WHERE p.user_id = u.id AND p.org_id IS NULL
  AND split_part(u.email, '@', 2) = o.domain AND o.status = 'approved';

INSERT INTO org_members (org_id, user_id)
SELECT o.id, u.id FROM auth.users u
JOIN organizations o ON split_part(u.email, '@', 2) = o.domain AND o.status = 'approved'
WHERE u.id NOT IN (SELECT user_id FROM org_members)
ON CONFLICT DO NOTHING;