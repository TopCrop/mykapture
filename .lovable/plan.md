

## Plan: Add Back Button to DashboardLayout

All app pages except Dashboard use `DashboardLayout`. A single change to that component covers every case.

### Changes

**1. `src/components/DashboardLayout.tsx`**
- Add optional `showBack` prop, default `true`
- When `showBack` is true, render a small `ArrowLeft` button in the header (before the sidebar trigger)
- On click: `useNavigate()(-1)` — goes to previous page in browser history

**2. `src/pages/Index.tsx`**
- Pass `showBack={false}` — Dashboard is the home page, no back needed

**No changes needed** for Leads, Events, Analytics, Settings, Documentation, or Super Admin — they all inherit the back button automatically.

### Navigation flows this fixes
- Dashboard stat cards → Leads (back to Dashboard)
- Events page → Leads filtered by event (back to Events)
- Super Admin → any sub-page (back to Super Admin)
- Notification click → Leads (back to previous page)
- Any sidebar navigation (back to wherever you came from)

