

## Problem: Users Not Auto-Assigned to Org After Signup

### Root Cause

The `handle_new_user()` trigger only runs **at signup time**. If a user signs up before their org exists (or before it's approved), they get `org_id = NULL` and no `org_members` row. There is **no retroactive assignment** mechanism.

Bhavesh signed up at 01:49 UTC, but the Keka org was created at 04:07 UTC — so the trigger couldn't match him.

Even for users who sign up **after** the org exists, this works. But the gap scenario is common: admin creates org, teammates may have already signed up earlier.

### Fix: Two-Part Solution

#### 1. Database Function: Backfill unassigned users on org approval

Create a trigger that fires when an org's status changes to `approved`. It finds all `profiles` with matching email domain that have no org, and assigns them:

```sql
CREATE OR REPLACE FUNCTION public.assign_unmatched_users_to_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only act when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Update profiles
    UPDATE profiles SET org_id = NEW.id
    WHERE org_id IS NULL
      AND user_id IN (
        SELECT id FROM auth.users
        WHERE split_part(email, '@', 2) = NEW.domain
      );
    -- Insert org_members
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
```

#### 2. Login-time fallback: Check on each login if user can be assigned

Update `useOrg.tsx` — when `membership` is null, attempt a one-time RPC call to a new `try_assign_user_to_org` function that checks if the user's email domain matches an approved org and assigns them. This covers users who signed up before the org was approved and somehow missed the trigger.

```sql
CREATE OR REPLACE FUNCTION public.try_assign_user_to_org()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _domain text;
  _org_id uuid;
  _uid uuid := auth.uid();
BEGIN
  -- Already has org?
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
```

#### 3. Update `src/hooks/useOrg.tsx`

When the membership query returns null (no org), call `try_assign_user_to_org` RPC. If it returns an org_id, invalidate queries so the UI updates immediately instead of redirecting to `/org-setup`.

#### 4. Fix existing data

Run a one-time migration to assign Bhavesh (and any other unmatched users) to their orgs:

```sql
-- Backfill existing unmatched users
UPDATE profiles p SET org_id = o.id
FROM auth.users u, organizations o
WHERE p.user_id = u.id AND p.org_id IS NULL
  AND split_part(u.email, '@', 2) = o.domain AND o.status = 'approved';

INSERT INTO org_members (org_id, user_id)
SELECT o.id, u.id FROM auth.users u
JOIN organizations o ON split_part(u.email, '@', 2) = o.domain AND o.status = 'approved'
WHERE u.id NOT IN (SELECT user_id FROM org_members)
ON CONFLICT DO NOTHING;
```

---

| Deliverable | File(s) |
|---|---|
| Backfill trigger on org approval | Migration SQL |
| Login-time fallback RPC | Migration SQL |
| Call fallback in useOrg when no membership | `src/hooks/useOrg.tsx` |
| Fix existing unmatched users | Same migration |

