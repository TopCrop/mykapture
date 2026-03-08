

## Admin End-to-End Journey Review and Improvements

### Current Admin Journey

The admin flow is: Landing Page → Auth (login) → Dashboard → Leads / Events / Analytics / Settings / Docs. The admin sees all leads (not filtered), has access to Analytics, Settings, and Docs pages. They can create events, edit any lead, export CSV, send follow-up emails, and delete leads.

### Issues and Improvements Identified

**1. Settings Page is a Dead End (High Priority)**
The Settings page shows four "Coming soon" cards with no functionality. For an admin, this should be the command center. We should build out at least **Team Management** — the admin should be able to view all users, see their roles, and change roles (admin/manager/sales_rep). The `user_roles` table and `has_role()` function already exist.

**2. No Way to View Contact Form Submissions (High Priority)**
The `contact_submissions` table exists with an admin-only SELECT policy, but there is no UI for admins to view these submissions. We need an admin panel or a section in Settings to list incoming contact form entries.

**3. No Admin User Management (High Priority)**
Admins cannot see who is on the platform, change roles, or remove users. We should add a Team Management section under Settings that lists profiles + roles with the ability to assign/change roles.

**4. No Lead Deletion UI (Medium Priority)**
The RLS policy allows admins to delete leads, but there is no delete button in the Leads page UI. We should add a delete action for admin users.

**5. No Event Edit/Delete (Medium Priority)**
Admins/managers have an ALL policy on events, but the UI only supports creating events — no editing or deleting. We should add edit/delete actions on event cards for admin/manager roles.

**6. Analytics Page Lacks Admin-Specific Insights (Low-Medium)**
The analytics page is functional but could benefit from:
- A conversion funnel (cold → warm → hot)
- Follow-up email sent rate
- Time-based trend chart (leads over time)

**7. No Audit Log or Activity Feed (Low Priority)**
Admins have no visibility into who did what and when. A simple activity log showing recent lead captures, edits, and follow-ups would improve oversight.

**8. Dashboard Missing Admin KPIs (Low Priority)**
The admin dashboard doesn't show team-level KPIs like: total users, follow-up completion rate, or contact form submissions count.

---

### Implementation Plan

#### Phase 1: Settings Page — Team Management
- Query `profiles` joined with `user_roles` to list all users
- Display a table with name, email, current role, joined date
- Add a role-change dropdown (admin only) that updates `user_roles` table
- No new migration needed — existing tables and policies support this

#### Phase 2: Contact Submissions Viewer
- Add a new tab/section in Settings or a dedicated page
- Query `contact_submissions` ordered by `created_at` desc
- Display in a table with name, email, mobile, reason, date
- Add an INSERT RLS policy so the edge function (using service role) can write, and anon users can insert via the edge function (already working)

#### Phase 3: Lead Delete Button
- Add a trash icon button on lead rows, visible only to admins
- Confirm with an AlertDialog before deleting
- Use `supabase.from('leads').delete().eq('id', leadId)`
- Invalidate leads query on success

#### Phase 4: Event Edit/Delete
- Add edit/delete icons on event cards for admin/manager
- Edit opens the existing create dialog pre-filled
- Delete with confirmation dialog
- Add `useUpdateEvent` and `useDeleteEvent` hooks in `useData.ts`

#### Phase 5: Dashboard Admin KPIs
- Add stat cards for: total team members, follow-up emails sent, contact submissions count
- Only shown for admin role

---

### Technical Details

- **No new database migrations needed** for Phases 1, 3, 4, 5 — existing RLS policies already support these operations
- Phase 2 needs no migration either — the table and admin SELECT policy exist; the edge function uses service role for inserts
- All role checks use `useAuth()` hook values (`isAdmin`, `isManager`) for conditional UI rendering
- Server-side enforcement remains via RLS policies — UI is just gating visibility, not security

