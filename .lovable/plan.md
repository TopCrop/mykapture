

## Goal

Wrap the **BANT Qualification** and **Needs** sections in Step 2 of Full Mode inside two visually distinct, bordered "card" containers so users perceive them as deliberate, premium qualification layers — not loose form fields. Make Step 2 feel like a guided, captivating qualification experience.

## Visual Design

Two stacked panels, each with:

- **Subtle teal-tinted border** (`border-primary/20`) and soft inner background (`bg-primary/[0.03]`) — picks up the Kapture teal accent without shouting.
- **Rounded corners** (`rounded-lg`) and generous internal padding (`p-4`).
- **Numbered step badge** in the top-left corner — small circular teal chip showing **"1"** and **"2"** so users immediately read these as two qualification stages.
- **Section title** next to the badge (e.g. "BANT Qualification") with a small **uppercase eyebrow label** above it ("Step 1 of 2 · Qualify the opportunity").
- **One-line helper subtitle** under each title explaining purpose:
  - BANT card: *"Score budget, authority, timeline, and company size."*
  - Needs card: *"Tag the modules they're interested in."*
- **Soft top accent line** (`border-t-2 border-primary/40`) on each card for a "tab" feel.

### Layout (Step 2)

```text
┌─ Current Solution (unchanged, sits above) ─────────┐

╔═══ teal accent line ═══════════════════════════════╗
║  [1]  STEP 1 OF 2 · QUALIFY THE OPPORTUNITY        ║
║       BANT Qualification                           ║
║       Score budget, authority, timeline, size.     ║
║                                                    ║
║   Budget [▼]            Authority [▼]              ║
║   Timeline [▼]          Employees [▼]              ║
╚════════════════════════════════════════════════════╝

╔═══ teal accent line ═══════════════════════════════╗
║  [2]  STEP 2 OF 2 · INTEREST AREAS                 ║
║       Needs                                        ║
║       Tag the modules they're interested in.       ║
║                                                    ║
║   ☐ ATS Hire   ☐ Payroll   ☐ Time & Attendance     ║
║   ☐ Reporting  ☐ PMS       ☐ L&D   ☐ PSA  ...      ║
╚════════════════════════════════════════════════════╝

[Schedule Follow-Up section — unchanged below]
```

## Implementation

**File:** `src/components/LeadCaptureDialog.tsx` (Step 2 block, lines ~498–564)

1. Wrap the BANT grid (Budget / Authority / Timeline / Employees) inside a `<div>` with classes:  
   `relative rounded-lg border border-primary/20 border-t-2 border-t-primary/40 bg-primary/[0.03] p-4 space-y-3`
2. Add header row: numbered teal chip (`h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-semibold`) + eyebrow label (`text-[10px] uppercase tracking-wider text-primary/70`) + title (`text-sm font-semibold text-foreground`) + helper subtitle (`text-xs text-muted-foreground`).
3. Repeat the same wrapper around the Needs section, with chip "2" and the Needs-specific labels.
4. Replace the existing plain `<h3>BANT QUALIFICATION</h3>` and the bare Needs `<Label>` since they are now part of the card headers.
5. No logic, state, or data changes — purely JSX + Tailwind. Quick Mode and Steps 1/3 untouched.

## Why this works

- The numbered chips and "Step X of 2" eyebrows make it unmistakable that these are two deliberate qualification stages, not optional clutter.
- Teal-tinted borders + accent line tie into the existing Kapture brand palette without introducing new colors.
- Helper subtitles answer "why am I filling this in?" in one glance, lifting completion rates.
- Cards visually separate qualification (BANT/Needs) from the follow-up scheduling block below, improving scannability.

