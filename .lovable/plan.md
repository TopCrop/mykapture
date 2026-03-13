

# Offline Support Improvements

## Current State
- OfflineBanner: **Already rendered** in DashboardLayout (line 28). No change needed.
- PWA Manifest: **Already configured** via `vite-plugin-pwa` in `vite.config.ts`. The service worker is auto-generated. No change needed.
- BusinessCardScanner: No offline handling — network errors show generic toast.
- VoiceNoteRecorder: No offline handling — upload failure crashes the flow.

## Changes

### 1. BusinessCardScanner — Offline Fallback (src/components/BusinessCardScanner.tsx)
- In `processBase64`, check `!navigator.onLine` before the fetch call. Also catch network errors (TypeError).
- On offline/network failure: show a toast ("You're offline — please fill in details manually"), skip OCR, and show an **editable manual entry form** instead of extracted results.
- Add state `manualMode` + `manualContact` to render editable input fields (name, title, company, email, phone).
- "Use This Contact" button works the same way — calls `onExtracted` with the manually entered data.

### 2. VoiceNoteRecorder — Offline Fallback (src/components/VoiceNoteRecorder.tsx)
- In `processRecording`, check `!navigator.onLine` before attempting upload.
- On offline: store the audio blob in `localStorage` as a base64 string (simpler than adding idb-keyval dependency) under a key like `kapture_offline_voice_notes`.
- Show toast: "You're offline — voice note saved locally and will sync when you're back online."
- Call `onTranscribed` with a placeholder result (empty transcription, note that voice note is pending).

### 3. Offline Voice Note Sync (src/lib/offlineQueue.ts)
- Add functions `queueVoiceNoteOffline(blob, userId)` and `syncOfflineVoiceNotes()`.
- Store voice note metadata (blob as base64, userId, timestamp) in localStorage.
- In `initOfflineSync`, also call `syncOfflineVoiceNotes()` when coming back online — upload pending blobs to storage.

### Files to modify
1. `src/components/BusinessCardScanner.tsx` — add offline check + manual entry form
2. `src/components/VoiceNoteRecorder.tsx` — add offline check + local storage of blob
3. `src/lib/offlineQueue.ts` — add voice note queueing and sync

No new dependencies needed. No other functionality changes.

