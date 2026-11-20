# Milestone 10 — Beta QA report

## Commands
- `npm install` — passed, 0 vulnerabilities
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run build` — passed, 37 routes
- `npx supabase db test` — passed, 2 files / 6 tests

## Browser QA
- Desktop 1440px: primary nav links clicked (Events, Crew, Gallery, Guides, News) — all navigated, no page errors, no failed network requests.
- Event date filter filled and submitted — URL updated with `?date=2026-11-20`; no errors.
- Mobile 360px: menu opened, mobile Crew link navigated, accessibility tree captured successfully.
- 1920px / reduced-motion: Tab keyboard navigation captured, accessibility tree complete, no page errors.
- Internal links: every `href="/..."` on public pages returned HTTP 200. External Discord/Instagram/Facebook and all three Discord channel links returned HTTP 200.
- Scroll down: hero video opacity 0, page video opacity 1, progress indicator "Join" active.
- Scroll up: hero video opacity 1, page video opacity 0, progress indicator reset.
- Live Seas board verified in accessibility tree: live status, next event, regional clock, event formats, Discord channels and quick actions all present.
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

## Usefulness upgrade verification
- `/tools` voyage checklist clicked in a real browser; progress updated to `1 of 7 ready · 14%` with no errors.
- Event calendar view verified with a temporary test event; the calendar grid and event title rendered, then the test event was deleted and the empty state confirmed.
- Next-event countdown component mounted on Live Seas and the events page; shows live days/hours/minutes/seconds for real events only.
- Back-to-top control added globally and appears after scrolling.
- Editorial serif display font and hand-drawn header ornament added using system fonts only — no external font requests.

## Final Milestone 10 re-audit
- All commands passed: `npm install`, typecheck, lint, production build, DB tests.
- Runtime diagnostics across 17 pages: no exceptions, no console errors, no failed network requests.
- Fixed: missing favicon (404) via original `src/app/icon.svg`.
- Fixed: LCP warning by making the official news featured image eager/priority.
- Fixed: remaining visible "Beta" hero text replaced with "Built by players, for players · Asia region".
- Progress rail verified homepage-only: present on `/`, absent on all other tested pages.
- Scroll voyage verified down/up: hero opacity 1→0, page 0→1, then reverses back to 1/0.
- Internal links: all 200. External social/Discord links: 200. Official site URLs return 403 to automated HEAD requests because their WAF blocks bots, but they open normally in a browser.
- 360px mobile menu and 1920px reduced-motion keyboard pass: no page errors, full accessibility tree.
- Privacy: no trackers, no raw HTML, no service-role key in client bundle, no public-page cookies.
- Docs: assets licences/sources recorded, placeholders marked `REPLACE_BEFORE_LAUNCH`, footer disclaimer present in rendered output, README contains all required sections.

## Full re-verification after owner control and Discord channels
- Commands: install, typecheck, lint, production build and DB tests all pass.
- 25 routes checked in a real browser: no exceptions, no console errors, no failed network requests, no broken images, no empty anchors.
- Progress rail verified homepage-only.
- Scroll voyage verified both directions (hero 1→0→1, page 0→1→0).
- Internal links all 200; external Discord/Instagram/Facebook 200; official news URLs 403 to bot HEAD requests because of their WAF, expected.
- Fixed: feature flags now also hide footer links, the static feature card and the Live Seas section. Disabled sections disappear from header, footer and homepage.
- Verified owner roles: `is_admin()` and `is_moderator()` both include `owner`; the test account has `owner` and `member`.
- Owner control APIs return 403 when unauthenticated.
- Image upload, Discord announcement, Discord event and role-command endpoints return 401/403 when unauthenticated.
- Discord provider enabled; official news sync returns 11 articles.
- Discord bot is running as `SOTA#8038`; `/sotafeed` command registered; no channels are hard-coded after migration 0025.
- Fixed deprecated Discord.js `ephemeral` option by using `MessageFlags.Ephemeral`; bot starts without warnings.
- Privacy: no trackers, no raw HTML, no service-role key in client bundle, no public-page cookies, security headers present.
- 360px mobile menu and 1920px reduced-motion keyboard navigation pass with no page errors.
