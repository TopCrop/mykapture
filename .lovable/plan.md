## Problem

You reported a sales rep seeing all leads in their org. The current Postgres RLS policy on `public.leads` already restricts SELECT to:

```text
org_id = my_org
AND (captured_by = me OR I'm admin OR I'm manager)
OR  I'm super_admin
```

So at the database layer, a true sales rep should only ever receive their own captured leads. Most likely the rep you observed actually has an elevated role, or had cached admin-era data in React Query. Either way, the client today blindly trusts whatever the server returns and never explicitly scopes the query — that's a correctness gap worth closing.

## Fix (defense in depth)

One change in `src/hooks/useData.ts`:

- `useLeads()` becomes role-aware. It reads `userRole` and `user.id` from `useAuth()`. If the user is **not** admin/manager/super_admin, the Supabase query gets an explicit `.eq('captured_by', user.id)` filter. The query key becomes `['leads', userRole, user.id]` so cached admin data never leaks across role/user changes.

That's it for the data layer. RLS already enforces the same rule server-side; the client filter just guarantees the UI matches even if (a) someone weakens the policy in future, (b) React Query has stale cache from a different role, or (c) an admin-era cached payload survives a sign-out/sign-in.

## UI consistency pass (`src/pages/Leads.tsx`)

Already correct:
- "Captured By" column hidden for sales reps (`isAdmin || isManager`).
- "Rep" filter dropdown hidden for sales reps.
- Bulk-delete + delete buttons hidden for sales reps.

No UI changes needed — once `useLeads()` is scoped, the page automatically shows only the rep's own leads, the rep filter (already hidden) stays hidden, and pagination/CSV export operate on the scoped set.

## What stays unchanged

- RLS policies on `leads` — already correct, no migration.
- Admin and manager experience — they continue to see all org leads.
- Super admin — continues to see all leads across all orgs.
- Dashboard (`Index.tsx`), Analytics, Events pages — all consume `useLeads()`, so they automatically get the scoped result for sales reps without further edits.

## Files touched

- `src/hooks/useData.ts` — make `useLeads()` filter by `captured_by` for sales reps and key the cache on role + user id.
