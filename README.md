# Sea of Thieves Asia — Beta Site

A dependency-free static site scaffold. Built in beta: **no invented community content**.

## Run locally
From this directory:
```bash
python3 -m http.server 8000
```
Then open <http://localhost:8000>.

Or simply open `index.html` in a browser.

## Files
- `index.html` — page structure
- `styles.css` — neutral baseline styling (NOT brand identity; see `docs/brand.md`)
- `config.js` — all placeholder values and empty-collection flags
- `app.js` — renders placeholders safely as "Coming soon"

## Placeholder contract
Source of truth: `docs/content.md`, `AGENTS.md`.

- Every placeholder value is exactly `REPLACE_BEFORE_LAUNCH`.
- `app.js` renders these as a **non-clickable** "Coming soon" label — never as
  a link, so no fake-looking URL can appear.
- Collections flagged `EMPTY_FOR_BETA` render an empty state. No sample events,
  members, statistics, testimonials, sponsors, or partnerships are seeded.

## Before launch
1. Replace values in `config.js` with real URLs supplied by the project owner.
2. Supply real brand specs (`docs/brand.md`) and replace neutral CSS defaults.
3. Add real assets and licensing info (`docs/assets.md`).
4. Populate collections with real data only.
