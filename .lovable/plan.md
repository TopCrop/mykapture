

## Problem

In Quick Capture mode, the Event dropdown is currently positioned BELOW the contact info section and the Current Solution field. After a rep scans a business card, the contact fields auto-populate and the rep's attention is drawn there — they often miss the Event dropdown sitting further down (or below the visible fold of the dialog), and end up submitting the lead with no event tag. Although a warning was added for untagged events, reps would prefer to see the event field upfront so they tag it before they even start scanning.

## Solution

Move the Event dropdown to be the **first field** in Quick Capture mode — above the "CONTACT INFO" section. Keep all other behavior identical. No changes to Full BANT mode.

### Changes to `src/components/LeadCaptureDialog.tsx`

**1. Reorder the Quick Mode block** (lines ~309–411)

Move the Event dropdown block (currently lines ~338–369) to the very top of the Quick Mode `div`, right after the opening `<div className="space-y-3">` and BEFORE the "CONTACT INFO" heading + Scan Card button row.

The new order in Quick Mode becomes:

1. **Event dropdown** (with the existing amber "no event tagged" warning)
2. CONTACT INFO header + Scan Card button
3. Contact fields (Name, Company, Email, Current Solution)
4. Voice Note
5. Quick Notes
6. Duplicate alert
7. Capture button

**2. Optional polish** — add a subtle label cue

Change the Event label in Quick mode from `"Event"` to `"Event"` with an inline hint line below the dropdown (only when no event is selected and warning is not yet shown):  
`"Tag the event first — leads without an event won't appear in event reports."`  
This is shown as muted helper text, not the amber warning. The amber warning still fires only when the rep clicks "Capture Lead" without an event.

**3. No other changes**

- Full BANT mode (Steps 1–3) is untouched — the Event dropdown stays where it is in Step 1.
- All existing logic (duplicate check, event filtering by role, completed-event clearing, warning, "Submit anyway") remains identical.
- No state, handler, or submission logic is changed — only JSX order within Quick Mode.

### Technical Detail

```text
Quick Mode layout (before)            Quick Mode layout (after)
─────────────────────────             ─────────────────────────
CONTACT INFO    [Scan Card]           Event [▼]
  Name *                              (helper text)
  Company    Email                    
  Current Solution                    CONTACT INFO    [Scan Card]
                                        Name *
Event [▼]                               Company    Email
(amber warning if empty)                Current Solution
                                      
Voice Note                            Voice Note
Quick Notes                           Quick Notes
[Capture Lead]                        [Capture Lead]
```

Files touched: `src/components/LeadCaptureDialog.tsx` (single block reorder, no new dependencies).

