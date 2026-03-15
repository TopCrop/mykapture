

## Plan: Add Bulk Delete to Leads Page (Admin & Super Admin Only)

### Changes

**`src/pages/Leads.tsx`**
- Add `selectedLeads` state (`Set<string>`) and `bulkDeleting` state
- Add a checkbox column (visible only for admins/super admins) with:
  - "Select all" checkbox in the header (selects all on current page)
  - Per-row checkbox (each lead)
- Add a "Delete selected (N)" button next to the Export/Capture buttons, shown only when selections exist
- Add an `AlertDialog` for bulk delete confirmation listing how many leads will be deleted
- Implement `handleBulkDelete` that iterates through selected IDs calling `deleteLead.mutateAsync` for each, with success/failure count feedback
- Highlight selected rows with `bg-primary/5`
- Clear selections when filters/page change

The existing `isAdmin` flag from `useAuth()` already covers both admin and super_admin roles, so no new permission logic is needed. The RLS policy on leads already restricts DELETE to admins within their org + super admins.

