

## Add Tooltips to "Schedule Follow-Up" — Two Locations

Both locations where "Schedule Follow-Up" appears as a user-facing action already identified. No additional locations needed.

### Changes

**1. `src/components/LeadCaptureDialog.tsx`** (~line 507-510)
- Wrap the "Schedule Follow-Up" label text with a `Tooltip` containing an `Info` icon
- Tooltip text: *"Creates an internal reminder visible in your notification bell. Calendar sync coming soon."*
- Import `Info` from lucide-react, and `Tooltip`/`TooltipTrigger`/`TooltipContent` from UI components

**2. `src/components/LeadDetailDialog.tsx`** (~line 56-59)
- Same treatment on the "Schedule Follow-Up" heading
- Same tooltip text for consistency

No new dependencies. Both `Tooltip` components and `Info` icon are already available in the project.

