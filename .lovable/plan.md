

## Plan: Edit Org Details + Show Admin/Creator Info

### Current State
- `organizations` table has: `id`, `name`, `domain`, `logo_url`, `status`, `created_at`, `updated_at`
- No `created_by` column to track who created the org
- No edit functionality in either SuperAdmin or OrganizationSettings
- `get_all_org_stats` RPC doesn't return admin or creator info

### Technical Changes

#### 1. Database Migration
Add `created_by` column to track the creator:
```sql
ALTER TABLE organizations ADD COLUMN created_by uuid REFERENCES auth.users(id);
```

Update `get_all_org_stats` RPC to return:
- `admin_email` — email of user with `admin` role in that org
- `admin_name` — display name of the admin
- `creator_email` — email from `created_by` user
- `account_created_at` — when the admin's profile was created

#### 2. Update `src/pages/OrgSetup.tsx`
Set `created_by: user.id` when inserting a new organization so future orgs track their creator.

#### 3. Update `src/pages/SuperAdmin.tsx`
- Add new columns to table: **Admin**, **Created By**
- Add **Edit** button per row → opens edit dialog
- Edit dialog allows changing: name, domain, logo_url

#### 4. Update `src/components/OrganizationSettings.tsx`
- Add **Edit** button for admins (their own org) and super admins (any org)
- Edit dialog with same fields: name, domain, logo_url

#### 5. RLS Policy Check
Existing `Super admins can manage all orgs` policy allows UPDATE. Admins need a new policy:
```sql
CREATE POLICY "Admins can update their own org"
ON organizations FOR UPDATE
TO authenticated
USING (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
WITH CHECK (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
```

---

| Deliverable | File(s) |
|-------------|---------|
| Add `created_by` column + RLS policy | 1 migration |
| Update `get_all_org_stats` RPC | Same migration |
| Set `created_by` on org creation | `src/pages/OrgSetup.tsx` |
| Edit org UI + admin/creator columns | `src/pages/SuperAdmin.tsx` |
| Edit org UI for regular admins | `src/components/OrganizationSettings.tsx` |

