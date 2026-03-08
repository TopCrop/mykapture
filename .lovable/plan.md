

## Sales Rep End-to-End Journey Analysis & Improvement Plan

### Current Journey (As-Is)

```text
Landing Page (lovable.app URL)
  └─> Auth Page (login/signup)
       └─> Dashboard (stats overview)
            ├─> Capture Lead (3-step dialog)
            │     ├─ Scan Business Card
            │     ├─ Voice Note
            │     └─ BANT + Follow-up booking
            ├─> Leads List (search, filter, detail, follow-up email)
            └─> Events (view only for sales_rep)
```

### Gaps & Improvements Identified

#### 1. No Public Landing / Install Page
**Problem**: There's no marketing or onboarding page. Users land directly on `/auth`. A sales rep at a conference won't know what the app does or how to install it on their phone.
**Fix**: Create a public landing page at `/` (move dashboard to `/dashboard`) with:
- App value proposition and key features
- "Install App" button with PWA install prompt
- QR code for quick mobile install at events
- Link to sign in/sign up

#### 2. PWA Not Fully Optimized for Mobile
**Problem**: PWA manifest has only a 64x64 favicon icon. No 192x192 or 512x512 icons, no splash screens. App won't look right when installed.
**Fix**: Add proper PWA icons (192x192, 512x512), maskable icons, and Apple touch icon meta tags in `index.html`.

#### 3. No Offline Support
**Problem**: At conferences, network is often unreliable. Currently, if offline, the app breaks completely. No queued submissions.
**Fix**: Add offline lead capture with local storage queue that syncs when connectivity returns. Show offline indicator banner.

#### 4. Dashboard Not Optimized for Sales Rep Mobile Use
**Problem**: Dashboard shows stats that aren't actionable for a rep on the floor. The primary action (Capture Lead) is a small button in the top-right.
**Fix**: For sales_rep on mobile, make "Capture Lead" a prominent floating action button (FAB). Show a simplified mobile-first view: last 3 leads + quick capture.

#### 5. Lead Capture UX Friction
**Problem**: 3-step dialog is heavy for a conference floor. Steps 2-3 (BANT, review) slow down capture when time is limited.
**Fix**:
- Add a "Quick Capture" mode: name + company + photo/voice only, skip BANT
- Make business card scan the primary CTA (most natural at conferences)
- Auto-advance after card scan fills fields
- Allow completing BANT qualification later from the lead detail view

#### 6. No Edit/Update Lead
**Problem**: Once a lead is captured, the rep can't edit it. Typos, missing info, or adding BANT later is impossible.
**Fix**: Add edit capability on the lead detail dialog.

#### 7. No Follow-Up Reminders / Notifications
**Problem**: Bell icon shows hardcoded "3" badge but notifications don't work. Follow-up bookings are created but there's no reminder system.
**Fix**: Implement a notifications dropdown showing upcoming follow-ups and recent activity. Connect to follow_up_bookings table.

#### 8. No Lead Deduplication
**Problem**: Same business card scanned twice creates duplicate leads.
**Fix**: Check for existing leads by email or phone before creating, prompt to merge or update.

#### 9. Leads Page Missing "My Leads" Filter for Sales Rep
**Problem**: The Leads page shows ALL leads for sales_rep (no `captured_by` filter like Dashboard has).
**Fix**: Apply the same `captured_by` filter on the Leads page for sales_rep role.

#### 10. No Bulk Actions
**Problem**: Can't select multiple leads to export, tag, or send follow-ups in batch.
**Fix**: Add checkbox selection + bulk export/follow-up actions.

### Priority Implementation Order

| Priority | Improvement | Impact |
|----------|------------|--------|
| P0 | Fix Leads page to filter by sales_rep | Bug fix |
| P0 | PWA icons + mobile meta tags | Install experience |
| P1 | Quick Capture mode (1-step) | Core UX for conference |
| P1 | Floating Action Button on mobile | Discoverability |
| P1 | Edit lead from detail view | Essential workflow |
| P2 | Public landing page with install CTA | Onboarding |
| P2 | Working notifications for follow-ups | Engagement |
| P2 | Offline queue for lead capture | Reliability |
| P3 | Lead deduplication | Data quality |
| P3 | Bulk actions on leads | Efficiency |

### Technical Approach

- **Quick Capture**: Add a `mode` prop to `LeadCaptureDialog` ("quick" | "full"). Quick mode = single step with name, company, email, photo, voice note, submit.
- **FAB**: Add a fixed-position button in `DashboardLayout` visible on mobile for sales_rep.
- **Edit Lead**: Add mutation hook `useUpdateLead` in `useData.ts`, add edit mode to `LeadDetailDialog`.
- **Leads filter fix**: Add the same `isSalesRep` filter logic from Index.tsx to Leads.tsx.
- **PWA icons**: Generate proper sized icons, update manifest in `vite.config.ts`, add meta tags to `index.html`.
- **Notifications**: Query `follow_up_bookings` where `status='scheduled'` and `follow_up_date` is upcoming, display in a dropdown from the bell icon.
- **Offline queue**: Use localStorage to queue lead submissions, process queue on `navigator.onLine` event.

