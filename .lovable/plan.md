

## Plan: Team Invitation System

### Overview
Org admins can invite users by email. An `invitations` table stores pending invites. When an invited user signs up, the `handle_new_user` trigger checks for a pending invitation and auto-assigns them to the org — even if their email domain doesn't match the org's domain.

### Database Changes (1 migration)

**New `invitations` table:**
```sql
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, expired
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (org_id, email)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins/managers in org can view and create invitations
CREATE POLICY "Users view invitations in org" ON public.invitations
  FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Admins create invitations" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins delete invitations" ON public.invitations
  FOR DELETE TO authenticated
  USING (
    org_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Super admins manage all invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));
```

**Update `handle_new_user()` trigger** to check `invitations` table before domain matching:
```sql
-- In handle_new_user(), BEFORE domain lookup:
-- Check if there's a pending invitation for this email
SELECT org_id INTO _org_id FROM public.invitations
  WHERE lower(email) = lower(NEW.email) AND status = 'pending' AND expires_at > now()
  LIMIT 1;

-- If found, mark invitation as accepted
IF _org_id IS NOT NULL THEN
  UPDATE public.invitations SET status = 'accepted' WHERE lower(email) = lower(NEW.email) AND org_id = _org_id;
END IF;

-- If no invitation found, fall back to domain matching (existing logic)
```

### Frontend Changes

**1. New `InviteTeamDialog` component** (`src/components/InviteTeamDialog.tsx`)
- Simple dialog with email input field
- Validates email format, inserts into `invitations` table
- Shows a copyable signup link (`{origin}/auth?invite={org_id}`)
- Shown from the Team tab in Settings

**2. New data hooks** in `useData.ts`
- `useInvitations()` — fetches pending invitations for the org
- `useCreateInvitation()` — inserts a new invitation
- `useDeleteInvitation()` — removes/cancels a pending invitation

**3. Update Settings Team tab** (`Settings.tsx`)
- Add "Invite" button next to the team header
- Show pending invitations list below team table with status badges and cancel action

**4. Update Auth page** (`Auth.tsx`)
- Read `?invite={org_id}` from URL params
- When present, pre-set the signup view and show a banner: "You've been invited to join [org name]"
- Skip the domain validation for invited signups (the invitation itself is the validation)

### Edge Function: `send-invite-email`
- Receives `{ email, org_name, invite_url }` from the client
- Uses Lovable AI to send a simple invite notification (or just rely on the copyable link for v1)
- **Decision**: Start with copy-link only (no email sending) to keep it simple. The admin copies and shares the link manually.

### Flow
```text
Admin → Settings → Team → "Invite Member"
  → enters email → system creates invitation row
  → shows copyable signup link with ?invite=org_id
  
Invited user → clicks link → Auth page (signup view)
  → signs up → handle_new_user checks invitations table
  → finds match → auto-joins org, marks invitation accepted
  → user lands on dashboard (no org-setup redirect)
```

### What's NOT changing
- RLS on all other tables (unchanged)
- Existing domain-based auto-join (still works as fallback)
- Email domain validation on signup is bypassed only when `?invite=` param is present

