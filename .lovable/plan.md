

## Role-Based Access: Admin vs Sales Rep Experience

**Current state**: All authenticated users see the same sidebar with Dashboard, Leads, Events, Analytics, Settings, and Docs. The `user_roles` table and `has_role()` function already exist with roles: `admin`, `moderator`, `sales_rep` (default on signup).

**Proposal**: Gate modules by role so sales reps get a focused, lead-centric experience while admins/managers retain full access.

### Role-Based Module Access

| Module | Sales Rep | Manager | Admin |
|--------|-----------|---------|-------|
| Dashboard (simplified) | Yes | Yes | Yes |
| Leads | Yes | Yes | Yes |
| Events | View only | Full | Full |
| Analytics | No | Yes | Yes |
| Settings | No | No | Yes |
| Docs | Yes | Yes | Yes |

### Implementation

1. **Add role fetching to `useAuth`** — Query `user_roles` table on login, expose `userRole` in context (`sales_rep`, `manager`, `admin`).

2. **Update `AppSidebar.tsx`** — Filter sidebar nav items based on `userRole`. Sales reps see: Dashboard, Leads, Events, Docs. Admins/managers see everything.

3. **Update `ProtectedRoute`** — Add an optional `requiredRole` prop. Routes like `/analytics` and `/settings` check for `admin`/`manager` role and redirect unauthorized users to `/leads`.

4. **Simplify Dashboard for sales reps** — On `Index.tsx`, hide org-wide analytics charts for `sales_rep` role; show only their own lead stats and recent captures.

5. **Events page** — Sales reps can view events but hide the "New Event" button (read-only access).

### Files to Change
- `src/hooks/useAuth.tsx` — fetch and expose role
- `src/components/AppSidebar.tsx` — conditional nav items
- `src/components/ProtectedRoute.tsx` — role-gated routes
- `src/App.tsx` — pass required roles to protected routes
- `src/pages/Index.tsx` — simplified dashboard for sales reps
- `src/pages/Events.tsx` — hide create button for sales reps

