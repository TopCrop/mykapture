

## Goal

Two changes:
1. **Hide Schedule Follow-Up** in the Lead Capture dialog by default (preserve code).
2. **Add a new "Features" admin tab** in Settings where admins can toggle org-level feature flags. The first flag is "Schedule Follow-Up" — when enabled by an admin, the Schedule Follow-Up section reappears for sales reps in their lead capture flow. When disabled (default), it stays hidden.

## Design

### A. New `org_features` table (per-org feature flags)

Schema:
```text
org_features
  org_id          uuid PK (FK → organizations, one row per org)
  schedule_follow_up   boolean  default false
  updated_at      timestamptz   default now()
  updated_by      uuid          (auth.uid)
```
- RLS:
  - SELECT: any org member (`org_id = get_user_org_id(auth.uid())`) OR super admin
  - INSERT/UPDATE: only admins of the org OR super admin
  - No DELETE
- Auto-create a row (all flags = false) when any user reads features for an org without one (handled client-side via upsert, or via trigger on org creation — we'll use lazy upsert from the admin Features panel).

### B. New admin tab: **"Features"** in `src/pages/Settings.tsx`

- Add `<TabsTrigger value="features">` with a `Sparkles`/`ToggleRight` icon (admin-only, alongside Organization/Team/Solutions).
- New component `src/components/FeatureFlagsManager.tsx`:
  - Card list of feature toggles with title + description + `Switch`.
  - First (and only) entry:
    - **Schedule Follow-Up** — *"Allow sales reps to schedule a follow-up call/meeting from the lead capture flow. Off by default."*
  - Saves via upsert to `org_features` on toggle, optimistic UI, toasts on success/error, React Query invalidation.
  - Designed to be extensible — adding future toggles is just one more `<FeatureToggleRow>` entry.

### C. Hook: `useOrgFeatures()` in `src/hooks/useData.ts`

- Fetches the row for the current `orgId` (defaults to `{ schedule_follow_up: false }` if no row exists).
- Uses CACHE_DEFAULTS staleTime so the toggle takes effect within 2 minutes for sales reps (or instantly on next page load).
- Companion `useUpdateOrgFeatures()` mutation that upserts and invalidates.

### D. Gate Schedule Follow-Up in `src/components/LeadCaptureDialog.tsx`

- Read flag: `const { data: features } = useOrgFeatures(); const showFollowUp = !!features?.schedule_follow_up;`
- Wrap the Schedule Follow-Up block (lines ~583–663) and the Step-3 review summary (lines ~723–728) with `{showFollowUp && (...)}`.
- In `handleSubmit`, gate the `createBooking.mutateAsync(...)` call with `if (showFollowUp && bookFollowUp && followUpDate && created) { ... }` so no booking is ever created when the feature is off.
- All state (`bookFollowUp`, `followUpDate`, etc.) stays declared — zero rework when toggled back on.

### E. What stays unchanged

- Quick Mode — no Schedule Follow-Up there to begin with.
- Step 1, BANT card, Needs card, Step 3 review (other than the conditional follow-up summary line) — untouched.
- `LeadDetailDialog.tsx` Schedule Follow-Up form — **not** affected (this is post-capture and stays available).
- All other Settings tabs unchanged.

## Layout (new Features tab)

```text
Settings  ›  Features

┌────────────────────────────────────────────────┐
│ ◐ Schedule Follow-Up                  [ OFF ]  │
│   Let sales reps book a follow-up call or      │
│   meeting from the lead capture dialog.        │
│   Off by default.                              │
└────────────────────────────────────────────────┘

(More toggles will appear here as new optional
 features ship.)
```

## Why this approach

- **Per-org, server-side flag** — admins control behavior for their whole org without code changes; super admins can also adjust on behalf of any org.
- **Sales reps see the change automatically** within React Query's staleTime, no redeploy.
- **Code preserved, not deleted** — flipping the toggle restores the full Schedule Follow-Up flow with zero engineering work.
- **Extensible pattern** — the same `org_features` table + `FeatureFlagsManager` UI scales to future toggles (e.g., voice notes, business card scanner).

## Files touched

- `supabase/migrations/<new>.sql` — create `org_features` table + RLS policies.
- `src/hooks/useData.ts` — add `useOrgFeatures()` and `useUpdateOrgFeatures()`.
- `src/components/FeatureFlagsManager.tsx` — new admin component.
- `src/pages/Settings.tsx` — add "Features" tab (admin-only).
- `src/components/LeadCaptureDialog.tsx` — gate Schedule Follow-Up UI + submission behind the flag.

