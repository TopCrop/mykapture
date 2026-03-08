

## UX Audit: Comprehensive Improvements Across All Roles

After reviewing every page and component, here are the high-impact UX gaps organized by priority. Each targets reducing clicks, surfacing the right info at the right time, and matching B2B user expectations.

---

### 1. Dashboard: Empty States and Contextual Actions

**Problem**: When there are zero leads, the dashboard shows stat cards with "0" values and empty charts -- no guidance on what to do next.

**Fix**: Add a rich empty state with onboarding steps ("Create your first event", "Capture your first lead", "Invite your team") that disappear once actions are taken. For sales reps with zero leads, show a prominent CTA card instead of empty charts.

---

### 2. Lead Table Rows Should Be Clickable (Dashboard + Leads)

**Problem**: On the dashboard, lead rows in the recent leads table are not clickable -- users must navigate to the Leads page, find the lead again, then click. That is 3 clicks for something that should be 1.

**Fix**: Make each row in the dashboard's recent leads table clickable, opening the `LeadDetailDialog` inline (same as the Leads page does). Reuse the existing `LeadDetailDialog` component.

---

### 3. Notification Dropdown: Click-Through to Lead

**Problem**: The notification dropdown shows upcoming follow-ups but they are dead-ends -- no way to navigate to the lead or the follow-up detail.

**Fix**: Make each follow-up item clickable, navigating to `/leads` with the lead pre-selected (or opening the lead detail dialog directly).

---

### 4. Events Page: Click Event Card to See Its Leads

**Problem**: Event cards show "X leads captured (Y hot)" but clicking the card does nothing. Users must mentally note the event name, go to Leads, then filter by event.

**Fix**: Make the lead count on event cards a clickable link that navigates to `/leads?event={eventId}`, pre-filtering the leads table. Also support this `event` query param in the Leads page filter initialization.

---

### 5. Settings > Team (Admin): Missing Email Column, No Quick Actions

**Problem**: The team table shows Name, Team, Territory, Role, Joined -- but no email. Admins managing a team need email visibility. There is also no way to view a team member's activity (how many leads they've captured).

**Fix**: Add an Email column. Add a "Leads" count column that links to `/leads?rep={userId}` showing that rep's leads. Support the `rep` filter param on the Leads page.

---

### 6. Manager Role: No Dashboard Differentiation

**Problem**: Managers see the same admin charts but lack the admin-only KPI row (Team Members, Follow-ups, Submissions). Managers should see team performance metrics relevant to their role.

**Fix**: Show a manager-specific KPI row: their team's lead count, their team's hot lead %, and follow-up completion rate. Filter these to only the reps in their territory/team if that data exists.

---

### 7. Analytics: Missing Time-Range Filter

**Problem**: Analytics shows all-time data with no way to filter by date range. For a B2B app, weekly/monthly/quarterly views are essential.

**Fix**: Add a date range filter (This Week / This Month / This Quarter / All Time) that filters all charts and tables.

---

### 8. Lead Detail Dialog: No Quick Follow-Up Scheduling

**Problem**: To schedule a follow-up for an existing lead, users must remember the lead, open the capture dialog, and re-enter info. There is no way to schedule a follow-up from the lead detail view.

**Fix**: Add a "Schedule Follow-Up" button inside the `LeadDetailDialog` that opens a compact booking form (date, time, duration, type) -- reusing the existing booking logic.

---

### 9. Sidebar: Role Badge Visibility

**Problem**: The sidebar footer shows user name and email but not their role. In a multi-role B2B app, users should always know what role they are operating under.

**Fix**: Add a small role badge (e.g., "Admin", "Manager", "Sales Rep") below the user name in the sidebar footer.

---

### 10. Global: Breadcrumb / Back Navigation from Filtered Views

**Problem**: When users click a stat tile and land on a filtered view (e.g., `/leads?classification=hot`), there is no indication they are viewing a filtered subset or a way to go back to the dashboard.

**Fix**: Add a contextual banner at the top of filtered pages: "Showing Hot Leads -- [Clear filter] [Back to Dashboard]". This uses the existing URL params.

---

### Implementation Priority

| Priority | Change | Effort |
|----------|--------|--------|
| 1 | Lead rows clickable on dashboard (item 2) | Small |
| 2 | Event cards link to filtered leads (item 4) | Small |
| 3 | Notification items link to leads (item 3) | Small |
| 4 | Role badge in sidebar (item 9) | Tiny |
| 5 | Team table: email + lead count columns (item 5) | Small |
| 6 | Filter context banner on pages (item 10) | Medium |
| 7 | Dashboard empty/onboarding state (item 1) | Medium |
| 8 | Follow-up from lead detail (item 8) | Medium |
| 9 | Manager-specific KPIs (item 6) | Medium |
| 10 | Analytics date range filter (item 7) | Medium |

All changes are additive -- no existing functionality is removed. Each one reduces clicks by 1-3 for common workflows.

