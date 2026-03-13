

## Add QR Code Scanning to Business Card Scanner

### What it does
Adds a third option — "Scan QR Code" — alongside "Take Photo" and "Upload Image" in the scanner dialog. When a QR code is detected (from camera or uploaded image), the URL is parsed and contact fields are pre-filled where possible.

### How it works

**New dependency**: `jsQR` — lightweight client-side QR code decoder that works on image data from canvas.

**UI changes in `src/components/BusinessCardScanner.tsx`**:
- Add a third button "Scan QR Code" with a `QrCode` icon (from lucide-react) in the initial buttons section
- When QR scanning is active, use the same camera feed but run `jsQR` on each frame to detect codes in real-time
- Show a visual indicator ("Scanning for QR code...") with a different overlay style
- Also support QR detection from uploaded images

**QR URL handling logic**:
- **LinkedIn URLs** (`linkedin.com/in/...`): Pre-fill `website` with the URL, extract the profile name slug as a rough `name`, then show manual entry form for the user to complete remaining fields
- **Lusha / other URLs**: Pre-fill `website` with the URL, show manual entry form
- **vCard data** (some QR codes encode vCard directly): Parse name, email, phone, company, title directly from the vCard text
- **Plain text**: Display it and let the user decide

**Component changes**:
1. Add `qrMode` state to distinguish QR scanning from photo capture
2. In QR mode, run a `requestAnimationFrame` loop calling `jsQR()` on the video canvas
3. When detected, stop camera, parse URL/vCard, show results or manual form pre-filled
4. Update dialog title/description contextually

### Files changed
- `src/components/BusinessCardScanner.tsx` — add QR scanning mode, URL parsing, vCard parsing
- `package.json` — add `jsQR` dependency

