

## Full Code Audit: Optimization, UX, and Missing Features

After reviewing every page, component, hook, and edge function, here are the issues and improvements organized by category.

---

### A. Bugs and Code Issues

1. **Duplicate `LeadDetailDialog` component** — `Index.tsx` has its own `DashboardLeadDetailDialog` (lines 30-169) that duplicates ~80% of the `LeadDetailDialog` in `Leads.tsx` (lines 196-401). The dashboard version lacks the Follow-Up scheduling button and BANT editing fields. This is a maintenance hazard.
   - **Fix**: Extract a shared `LeadDetailDialog` component into `src/components/LeadDetailDialog.tsx` and import it in both pages.

2. **Settings Team table "Email" column shows phone** — In `Settings.tsx` line 100, the "Email" column header renders `profile.phone`, not the user's email. The profiles table doesn't store email (it's in `auth.users`). So the column is mislabeled and shows phone data.
   - **Fix**: Rename the column header from "Email" to "Phone" since we can't query `auth.users` from the client.

3. **Duplicate check not debounced** — `LeadCaptureDialog.tsx` fires an RPC call on every keystroke for email/phone fields. Rapid typing triggers many unnecessary database calls.
   - **Fix**: Add a 500ms debounce to `checkDuplicate`.

4. **LeadCaptureDialog doesn't trigger duplicate check after business card scan** — `handleCardScanned` sets email/phone via `setEmail`/`setPhone` directly, bypassing `handleEmailChange`/`handlePhoneChange`, so the duplicate check never runs after scanning.
   - **Fix**: Call `checkDuplicate` at the end of `handleCardScanned`.

5. **Missing `website` field in lead capture** — The leads table has a `website` column and the business card scanner extracts it, but the LeadCaptureDialog form doesn't include a website input and doesn't save scanned website data to the lead.
   - **Fix**: Add website to the form data and include it in `handleSubmit`.

---

### B. UX Improvements

6. **No loading state on dashboard** — When leads/events are loading, stat cards show "0" values briefly, then jump to real numbers. This causes a flash of incorrect data.
   - **Fix**: Show skeleton loaders for stat cards while `leadsLoading` is true.

7. **No confirmation when leaving unsaved edits** — In lead detail dialogs, if a user is editing and clicks outside, changes are silently discarded.
   - **Fix**: Show a confirmation prompt when closing a dialog with unsaved edits.

8. **Dashboard table limited to 10 rows with no indication** — The dashboard shows `filteredLeads.slice(0, 10)` but doesn't tell users there are more results beyond the "View all" link.
   - **Fix**: Add a subtle "Showing 10 of {n}" text and make "View all" more prominent when there are more leads.

9. **No success feedback after scheduling a follow-up from lead detail** — The `ScheduleFollowUpForm` closes after success but the lead detail dialog stays open with no visual update showing the scheduled follow-up.
   - **Fix**: Show scheduled follow-ups list within the lead detail dialog.

10. **Analytics page accessible only to admin/manager but error handling is missing** — If a sales rep somehow navigates to `/analytics`, `ProtectedRoute` redirects. But analytics data hooks still run before redirect completes.
    - **Fix**: This is minor but add `enabled: !isSalesRep` to analytics queries.

---

### C. Missing Features Worth Adding

11. **No search on Events page** — Events page has a status filter but no search bar. With many events, users can't find specific ones.
    - **Fix**: Add a search input that filters by event name/location.

12. **No way to mark a follow-up as completed** — Follow-up bookings have a `status` field (scheduled/completed) but there's no UI to mark one as done.
    - **Fix**: Add a "Mark Complete" button on the notification dropdown items and in the lead detail dialog.

13. **CSV export doesn't include event name** — `exportCsv` in Leads.tsx exports raw data but doesn't resolve the event name. Users get a UUID in the Event column.
    - **Fix**: Look up event name from the events list during export.

---

### D. Performance Optimizations

14. **`useProfiles` called redundantly** — `AppSidebar` and `Index` both call `useProfiles()` which fetches ALL profiles. The sidebar only needs the current user's profile.
    - **Fix**: Use `useMyProfile()` in `AppSidebar` instead of `useProfiles()`.

15. **Leads page doesn't memoize filtered results** — The `filtered` variable in `LeadsPage` runs on every render without `useMemo`.
    - **Fix**: Wrap in `useMemo` with proper dependencies.

---

### Implementation Priority

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | Extract shared LeadDetailDialog | Medium | High (dedup, consistency) |
| 2 | Fix "Email" column → "Phone" | Tiny | Fixes incorrect UI |
| 3 | Debounce duplicate check | Small | Reduces DB calls |
| 4 | Fix duplicate check after card scan | Tiny | Bug fix |
| 5 | Add website field to capture form | Small | Completeness |
| 6 | Dashboard skeleton loaders | Small | Better perceived performance |
| 7 | Unsaved edit confirmation | Small | Data safety |
| 8 | "Showing X of Y" on dashboard table | Tiny | Clarity |
| 9 | Show scheduled follow-ups in detail | Medium | Workflow completeness |
| 10 | Guard analytics queries | Tiny | Correctness |
| 11 | Search bar on Events page | Small | Usability |
| 12 | Mark follow-up as completed | Medium | Critical missing workflow |
| 13 | Include event name in CSV export | Tiny | Data quality |
| 14 | Use useMyProfile in sidebar | Tiny | Performance |
| 15 | Memoize leads filter | Tiny | Performance |

All 15 changes are additive and non-breaking.

