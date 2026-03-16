

## Plan: Fix Dashboard Layout for Mobile/Small Screens

Four targeted CSS-only changes — no logic, colour, or spacing changes.

### Changes

**1. `src/components/DashboardLayout.tsx` — Main scrollable area (line 58)**
Change `<main>` classes from `flex-1 overflow-auto` to `flex-1 min-h-0 overflow-y-auto` so content scrolls properly on short viewports.

**2. `src/components/DashboardLayout.tsx` — Header subtitle (line 51)**
Add `truncate max-w-[180px] sm:max-w-none` to the subtitle `<p>` tag to prevent it from pushing the header layout on very narrow screens.

**3. `src/components/StatCard.tsx` — Card container + title truncation**
- Add `min-w-0` to `cardClasses` (line 64) so cards respect flex constraints.
- Add `truncate` to the title `<p>` on line 30.

**4. `src/pages/Index.tsx` — Leads table horizontal scroll**
The `overflow-x-auto` wrapper already exists on line 394. No change needed here — already implemented.

