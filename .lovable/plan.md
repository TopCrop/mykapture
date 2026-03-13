

## Issues Analysis

### Issue 1: Success toast not visible after lead capture

The code already has `toast.success("Lead captured successfully!")` (line 237 in LeadCaptureDialog.tsx). The toast is likely being fired but not seen because:
- On mobile, the Sonner toast may render behind the closing dialog or at a position obscured by the UI
- The dialog closes immediately after the toast fires (`onClose()` on line 239), which may cause the toast to not render visibly

**Fix**: Ensure the Sonner `<Toaster>` in App.tsx has a high z-index (`style={{ zIndex: 9999 }}`) and set `position="top-center"` so it's always visible on mobile. Also add a small delay before closing the dialog or use `richColors` for better visibility.

### Issue 2: New lead not appearing in the list

The `useCreateLead` mutation already calls `queryClient.invalidateQueries({ queryKey: ["leads"] })` on success, which should trigger a refetch. However, two potential causes:

1. **RLS silent rejection for super_admin**: The INSERT policy on `leads` requires `org_id = get_user_org_id(auth.uid())`. For the super_admin (who has no org), `get_user_org_id()` returns `null`, making the comparison `null = null` evaluate to `false` — silently rejecting the insert. This needs an RLS policy update to allow super_admin inserts.

2. **For org users**: The insert should work, but the `.select().single()` might fail silently in some edge cases. Adding error logging will help debug.

**Fix**:
- Update the INSERT RLS policy on `leads` to include `OR is_super_admin(auth.uid())` so super admins can also insert leads
- Update the SELECT policy similarly (already has it)
- Add explicit error handling and console logging in the mutation to catch silent failures

## Changes

### 1. Database migration — Update leads INSERT RLS policy
```sql
DROP POLICY IF EXISTS "Users create leads in org" ON public.leads;
CREATE POLICY "Users create leads in org"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = captured_by AND org_id = get_user_org_id(auth.uid()))
    OR is_super_admin(auth.uid())
  );
```

### 2. `src/App.tsx` — Improve Sonner toast visibility
Add `position="top-center"` and high z-index to the `<Sonner />` component so toasts are always visible, especially on mobile and above dialogs.

### 3. `src/components/LeadCaptureDialog.tsx` — Minor improvements
- Add console error logging in the catch block for debugging
- No other changes needed — the success toast and query invalidation are already correct

