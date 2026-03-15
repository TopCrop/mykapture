

## Plan: Downloadable Executive PowerPoint

I can't share binary files directly in chat. The simplest approach: create a standalone utility page (no app navigation changes) that auto-generates and downloads the `.pptx` when you visit it.

### What gets built

1. **Install** `pptxgenjs` dependency

2. **Create `src/lib/generateExecutiveDeck.ts`** — Function that builds an 8-slide branded executive deck and triggers browser download:
   - Title, Problem, Solution, Features, Security, Analytics, Scalability, CTA
   - Dark bg (#141620), teal accent (#2dd4a0), white text

3. **Create `src/pages/DownloadDeck.tsx`** — Minimal page with one "Download Executive Deck" button. No sidebar link, no navigation entry. You visit `/download-deck` directly, click the button, get the `.pptx`.

4. **Edit `src/App.tsx`** — Add `/download-deck` route (unprotected, no sidebar)

### What does NOT change
- No Settings page changes
- No sidebar/navigation changes
- No in-app viewer

After downloading, you can delete the route if you like. It's just a delivery mechanism.

