

## Problem

New users (default `sales_rep` role) hit the `canCreate = isAdmin || isSuperAdmin` guard on `/org-setup` and see a dead-end "contact your admin" message. They can't use the app at all.

## Proposed Flow

1. **Any user can create an org** — remove the `canCreate` guard so the first user from any domain can create their workspace and start using the app immediately.
2. **Org starts in "pending" status** — a new `status` column on `organizations` (values: `pending`, `approved`, `rejected`, default `pending`). Pending orgs are fully functional for their members but visible to the super admin for review.
3. **Super admin gets notified** — when a new org is created, an edge function sends an email to the super admin (you) with the org name, domain, and creator's email, asking you to approve or reject.
4. **Super admin approves/rejects from the Super Admin dashboard** — add approve/reject buttons next to each pending org. Approved orgs become permanent; rejected orgs could be flagged (users see a "your org was not approved" message).
5. **Subsequent users auto-join approved orgs** — the existing `handle_new_user` trigger already handles domain matching, so once an org is approved, new signups with that domain auto-join seamlessly.
6. **Org creator gets `admin` role for their org** — so they can manage their own team (invite members, manage leads). This is scoped to their org only; it doesn't grant super admin access.

## Technical Changes

### 1. Database migration

- Add `status` column to `organizations`: `ALTER TABLE organizations ADD COLUMN status text NOT NULL DEFAULT 'pending';`
- Update existing orgs to `approved`: `UPDATE organizations SET status = 'approved' WHERE status = 'pending';`
- Add RLS INSERT policy on `organizations` for any authenticated user without an org: `WITH CHECK (get_user_org_id(auth.uid()) IS NULL)`
- Add RLS INSERT policy on `org_members` for self-insert without existing org: `WITH CHECK (user_id = auth.uid() AND get_user_org_id(auth.uid()) IS NULL)`

### 2. `src/pages/OrgSetup.tsx`

- Remove `canCreate` guard — always show the creation form.
- After creating the org, upsert the creator's role to `admin` in `user_roles`.
- After creation, invoke a new edge function `notify-new-org` to email the super admin.

### 3. New edge function: `supabase/functions/notify-new-org/index.ts`

- Accepts org name, domain, creator email.
- Sends an email to a configured super admin email (stored as a secret `SUPER_ADMIN_EMAIL`) via Resend.
- Email contains org details and a link to the Super Admin dashboard for approval.

### 4. `src/pages/SuperAdmin.tsx`

- Show org `status` badge (pending/approved/rejected) in the table.
- Add Approve/Reject action buttons for pending orgs.
- Approve action updates `organizations.status = 'approved'`.
- Reject action updates `organizations.status = 'rejected'` (and optionally notifies the org admin).

### 5. Optional: Block pending orgs from domain auto-join

- Update `handle_new_user()` trigger to only match domains where `status = 'approved'`, so new signups don't auto-join orgs that haven't been approved yet.

## Summary of deliverables

| Change | Files |
|--------|-------|
| Add `status` column + RLS policies | 1 migration |
| Update `handle_new_user` trigger | 1 migration |
| Allow all users to create org + auto-promote to org admin | `src/pages/OrgSetup.tsx` |
| Notify super admin on new org | `supabase/functions/notify-new-org/index.ts` |
| Approve/reject UI | `src/pages/SuperAdmin.tsx` |
| Add `SUPER_ADMIN_EMAIL` secret | Secret config |

