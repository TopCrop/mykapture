

## UX Recommendation: Make Dashboard Stat Tiles Interactive

As a B2B UX designer, the golden rule is: **every visible metric should be one click away from its detail**. Right now, all four stat tiles (Total Leads, Hot Leads, Avg Score, Active Events) and the three admin tiles (Team Members, Follow-ups Sent, Contact Submissions) are static — dead-end displays. That's wasted intent.

### What each tile should do on click

| Tile | Action | Rationale |
|------|--------|-----------|
| **Total Leads** | Navigate to `/leads` | User sees the number → wants to see who they are |
| **Hot Leads** | Navigate to `/leads?classification=hot` | Highest-intent leads — surface them instantly |
| **Avg Score** | Navigate to `/analytics` | Score is a trend metric — show the breakdown |
| **Active Events** | Navigate to `/events?status=active` | User wants to see *which* events are live |
| **Team Members** *(admin)* | Navigate to `/settings?tab=team` | Manage the team |
| **Follow-ups Sent** *(admin)* | Navigate to `/leads?followup=sent` | See which leads got follow-ups |
| **Contact Submissions** *(admin)* | Navigate to `/settings?tab=submissions` | Review inbound submissions |

### Implementation approach

1. **Extend `StatCard`** — add an optional `href` prop. When present, wrap the card in a `<Link>` with a subtle hover cursor change (pointer + slight scale/border highlight). No new components needed.

2. **Update `Index.tsx`** — pass `href` to each `StatCard` instance with the appropriate deep-link URL (including query params for pre-filtered views).

3. **Update receiving pages** — ensure `/leads`, `/events`, and `/settings` read query params on mount and apply them as default filter values. The Leads page already has filter state; it just needs to initialize from `searchParams`. Events page needs a similar treatment for `status`. Settings already reads `?tab=`.

### What stays the same
- The tiles themselves look good — clean, scannable. No visual redesign needed.
- Charts below the tiles remain non-clickable (they already have tooltips and the "View all" link handles drill-down).

