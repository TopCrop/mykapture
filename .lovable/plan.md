

## Problem

The BANT "Needs" checkboxes in lead capture are hardcoded as: `["automation", "integration", "analytics", "reporting", "marketing", "security", "compliance", "other"]`. Every organization sells different solutions, so these options need to be configurable per-org by managers/admins, and globally by super admins.

## Solution

### 1. New database table: `org_solution_options`

Stores custom solution/need options per organization.

```sql
CREATE TABLE public.org_solution_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: org members can read, admin/manager can manage, super_admin full access
```

When an org has no rows in this table, the app falls back to the current hardcoded defaults.

### 2. Data hooks (`src/hooks/useData.ts`)

- `useOrgSolutionOptions(orgId)` — fetch options for an org
- `useCreateSolutionOption()` — add a new option
- `useDeleteSolutionOption()` — remove an option
- `useUpdateSolutionOption()` — rename or reorder

### 3. Settings UI — new "Solutions" config section

Add a **"Solutions"** tab in `src/pages/Settings.tsx` (visible to admin/manager). It shows the current list of solution options with the ability to:
- Add a new solution label
- Delete existing ones
- Reorder (optional, sort_order)

### 4. Super Admin — solution management per org

In `src/pages/SuperAdmin.tsx`, add a solution options manager within the Events tab or as a third tab, scoped to the selected org. Same CRUD UI.

### 5. Lead Capture integration

In `src/components/LeadCaptureDialog.tsx`:
- Fetch `useOrgSolutionOptions(orgId)` from the user's org
- If options exist, use them instead of the hardcoded `NEED_OPTIONS`
- Fall back to defaults if none configured

### Files to modify/create

| File | Change |
|---|---|
| Database migration | Create `org_solution_options` table with RLS |
| `src/hooks/useData.ts` | Add CRUD hooks for solution options |
| `src/pages/Settings.tsx` | Add "Solutions" tab for admin/manager |
| `src/pages/SuperAdmin.tsx` | Add solution management for selected org |
| `src/components/LeadCaptureDialog.tsx` | Replace hardcoded `NEED_OPTIONS` with dynamic fetch |

