

## Problem

Approving a pending user fails with:

```
column "confirmed_at" can only be updated to DEFAULT
```

The current `public.admin_approve_user` function tries to write directly to `auth.users.confirmed_at`:

```sql
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE id = _user_id
  AND email_confirmed_at IS NULL;
```

In Supabase's auth schema, `confirmed_at` is a **generated column** computed from `email_confirmed_at` and `phone_confirmed_at`. Postgres rejects any direct write to it (only `DEFAULT` is allowed), which aborts the whole transaction — so the profile never gets marked approved either.

## Fix

Single migration that replaces `public.admin_approve_user` to update only `email_confirmed_at`. Postgres recomputes `confirmed_at` automatically.

### Migration

```sql
CREATE OR REPLACE FUNCTION public.admin_approve_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target_org_id uuid;
  _caller_org_id uuid;
BEGIN
  -- Only admins / super admins
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorised';
  END IF;

  -- Same-org check (super admins bypass)
  IF NOT public.is_super_admin(auth.uid()) THEN
    SELECT org_id INTO _target_org_id FROM public.profiles WHERE user_id = _user_id;
    SELECT public.get_user_org_id(auth.uid()) INTO _caller_org_id;
    IF _target_org_id IS NULL OR _target_org_id <> _caller_org_id THEN
      RAISE EXCEPTION 'Cannot approve users outside your organization';
    END IF;
  END IF;

  -- Mark approved on profile
  UPDATE public.profiles
  SET manually_approved_by = auth.uid(),
      manually_approved_at = now(),
      email_confirmed = true
  WHERE user_id = _user_id;

  -- Confirm email; confirmed_at is generated and updates automatically
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = _user_id
    AND email_confirmed_at IS NULL;
END;
$$;
```

### What stays unchanged

- All RLS policies on `profiles`, `org_features`, etc.
- `PendingUsersSection.tsx` and the `list-pending-auth-status` / `resend-verification` edge functions — no client changes needed.
- The "Approve Now" button will work as soon as the migration runs.

## Files touched

- `supabase/migrations/<new-timestamp>_fix_admin_approve_user.sql` — single `CREATE OR REPLACE FUNCTION` statement above.

