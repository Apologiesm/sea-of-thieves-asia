# Milestone 10 — Beta QA report

## Commands
- `npm install` — passed, 0 vulnerabilities
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run build` — passed, 37 routes
- `npx supabase db test` — passed, 2 files / 6 tests

## Browser QA
- Desktop 1440px: all primary nav links clicked (Events, Crew, Gallery, Guides, News) — all navigated, no page errors, no failed network requests.
- Mobile 360px: menu opened, mobile Events link navigated, accessibility tree captured successfully.
- Internal links: every `href="/..."` on public pages returned HTTP 200. External Discord/Instagram/Facebook links returned HTTP 200.
- Scroll down: hero video opacity 0, page video opacity 1, progress indicator "Join" active.
- Scroll up: hero video opacity 1, page video opacity 0, progress indicator reset.
- No tracking scripts found; no `set-cookie` on public pages; security headers present.

## Fixes made during QA
- Footer policy links (Rules, Privacy, Terms, Security, Data request) rendered as
  "Coming soon" because `safeHref` rejected internal paths. Fixed in
  `src/components/layout/site-footer.tsx`; all now resolve to real pages.

## Verified by inspection
- Unofficial disclaimer present in footer on every page.
- Placeholders remain `REPLACE_BEFORE_LAUNCH` in config/docs and render as
  disabled "Coming soon" in the UI.
- Colour contrast ratios: body text 18:1, muted text 8.3–9.2:1, accent 8:1 on
  dark backgrounds — all above WCAG AA.
- Reduced-motion CSS hides videos and disables animation.
- RLS on all 15 tables; no anon write policies; audit functions present.

## Known limitations (not beta blockers for UI, but required before public launch)
1. Discord OAuth credentials are not configured, so authenticated create/edit/RSVP/upload
   flows could not be clicked end-to-end. API authorization was verified via
   unauthenticated 401/403 responses.
2. The R3F 3D scene code exists but is not mounted in the current design; the
   background is the two owner-supplied video loops. "No-WebGL fallback" is
   therefore not applicable — the video layers have poster-image fallbacks.
3. The supplied Sea of Thieves video footage has no documented publishing
   rights. `docs/assets.md` records this; confirm rights or replace before launch.
4. Rate limiting is in-memory per process; use Postgres/Redis for multi-instance production.
