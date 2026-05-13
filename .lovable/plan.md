## Goal

After a successful business card scan, automatically save the cropped photo to the rep's device — instead of requiring them to tap "Save Photo". Reps often want to refer back to the original card later.

## Behavior

- After a scan completes successfully (live camera or uploaded image), trigger a download of the cropped JPEG to the device.
  - Android Chrome: saves silently to Downloads.
  - iOS Safari: shows a one-tap "Download" confirmation (browser limitation — cannot be bypassed).
- Filename: `business-card-{company-or-name-or-timestamp}.jpg` so reps can find it later by company.
- Do not auto-download if the scan failed / fell back to manual entry (no useful image to keep).
- Do not auto-download in QR-code mode (no card photo, just decoded data).
- Keep the existing manual "Save Photo" button as a fallback (in case the auto-save was dismissed).

## User control

Add a per-user preference: "Auto-save scanned cards to device" (default: ON), stored in `localStorage` under `kapture.autoSaveCards`. Surface as a small `Switch` in `ProfileSettings.tsx` under a "Scanner" section.

## Technical changes

1. `src/components/BusinessCardScanner.tsx`
   - Extract a small helper `downloadPreview(preview, result)` that builds a sane filename from `result.company || result.name || Date.now()` (sanitized: lowercase, non-alphanum → `-`).
   - In the scan success path (after `setResult(...)` for both the camera capture and the file-upload paths), read `localStorage.getItem('kapture.autoSaveCards')` (default `'true'`) and call `downloadPreview` when enabled and `!qrMode`.
   - Replace the inline download logic in the existing "Save Photo" button (lines ~710–717) with the same helper for consistency.

2. `src/components/ProfileSettings.tsx`
   - Add a "Scanner" section with a Shadcn `Switch` labelled "Auto-save scanned business cards to device", help text noting iOS shows a one-tap confirmation.
   - Persist to `localStorage` (no DB column needed — this is a device-local preference).

## Out of scope

- No backend storage / no Supabase Storage bucket.
- No changes to OCR, cropping, compression (already 0.65), or duplicate-check logic.
- No changes to voice-note recorder.
