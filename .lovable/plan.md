

## Problem

Currently, only admins and managers within an org can create events. But when an org is first approved, there are no admins — all users are `sales_rep` by default (we removed auto-admin promotion). So **nobody in the org can create events**. The super admin needs a way to manage events across all organizations from the Super Admin dashboard.

Additionally, the super admin already has RLS access to all events (via the `is_super_admin` policy), and `useCreateEvent` attaches `org_id` from `useOrg()` — but super admin has no org, so they can't create events for other orgs either.

## Solution: Add Event Management to Super Admin Dashboard

### 1. Super Admin Dashboard — Add an "Events" management section

Expand `src/pages/SuperAdmin.tsx` with a tabbed layout (using existing Tabs component):
- **Tab 1: Organizations** — existing org management table (no changes)
- **Tab 2: Events** — new event management panel scoped per organization

The Events tab will:
- Show an org selector dropdown (list of approved orgs)
- Display events for the selected org in a table/card grid
- Allow creating, editing, and deleting events for that org
- Reuse the same event form fields (name, location, date, status)

### 2. Data layer changes

Add a new hook `useOrgEvents(orgId)` in `useData.ts` that fetches events filtered by a specific `org_id`. The super admin's existing RLS policy already grants full access.

Add a new `useCreateEventForOrg()` mutation that accepts an explicit `org_id` parameter (instead of deriving it from `useOrg()`), so the super admin can create events under any org.

### 3. No database changes needed

The super admin already has an `ALL` RLS policy on events. No schema or migration changes required.

### Files to modify

| File | Change |
|---|---|
| `src/pages/SuperAdmin.tsx` | Add Tabs with Organizations + Events tabs; Events tab with org selector, event list, create/edit/delete |
| `src/hooks/useData.ts` | Add `useOrgEvents(orgId)` and `useCreateEventForOrg()` hooks |

### 4. Also: Consider role promotion

The super admin should also be able to promote a user to `admin` within an org — otherwise no one can manage events from within the org itself. This is a separate feature but worth flagging. For now, the Events tab on Super Admin solves the immediate need.

