

## Plan: Fix Missing `status` Column + Add Pending Org Banner

### Critical Bug Fix

The `organizations` table is missing a `status` column. Both `handle_new_user()` and `get_all_org_stats()` reference `o.status` / `organizations.status`, causing:
- **Signup failures** ("Database error saving new user")
- **SuperAdmin dashboard broken** (400 errors on `get_all_org_stats`)

### Changes

#### 1. Database Migration
Add the missing `status` column to `organizations`:
```sql
ALTER TABLE organizations ADD COLUMN status text NOT NULL DEFAULT 'pending';
```
Update existing orgs to `'approved'` so current users aren't locked out.

#### 2. Update `useOrg.tsx`
Expose `org.status` in the Organization interface and OrgContext so dashboard components can check if the org is pending.

#### 3. Add Pending Org Banner to `src/pages/Index.tsx`
At the top of the dashboard, if `org.status !== 'approved'`, render an alert banner:
- Yellow/amber styling consistent with the dark theme
- Message: "Your workspace is under review. A super admin will approve your organization shortly."
- Non-dismissible (disappears automatically when approved)

| Deliverable | File(s) |
|---|---|
| Add `status` column to organizations | 1 migration |
| Expose org status in context | `src/hooks/useOrg.tsx` |
| Pending org banner on dashboard | `src/pages/Index.tsx` |

