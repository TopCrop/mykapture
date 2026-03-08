

## Logo Redesign: Kapture Wordmark with Embedded Icon

**Concept**: Create a flat, typographic logo where the "K" in "Kapture" incorporates a stylized capture/crosshair element — similar to how HubSpot embeds its sprocket in the wordmark. The design will be pure SVG, no external assets needed.

### Design Direction
- The **"K"** will have a small crosshair/viewfinder notch integrated into its letterform (representing "capture")
- Flat, modern style using the existing primary color (teal/mint `hsl(168, 80%, 48%)`)
- Clean sans-serif aesthetic matching the Space Grotesk font family already in use

### Files to Update
1. **Create `src/components/KaptureLogo.tsx`** — Reusable SVG logo component with size variants (small for sidebar, medium for auth page)
2. **`src/components/AppSidebar.tsx`** — Replace the Zap icon + text with the new KaptureLogo component
3. **`src/pages/Auth.tsx`** — Replace the Zap icon + "Kapture" text with the logo component

### Logo SVG Details
- "K" letterform with an integrated crosshair/target element (bottom-right of the K's diagonal strokes)
- Remaining letters "apture" rendered as clean text
- Single color (primary teal) with optional white variant for dark backgrounds
- Props: `size?: "sm" | "md" | "lg"`, `showSubtitle?: boolean`

