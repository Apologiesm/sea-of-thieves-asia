# AGENTS.md — Sea of Thieves Asia

Instructions for AI coding agents working in this repository. Read this file
completely before editing anything.

## Project purpose
This repository builds the community site for **Sea of Thieves Asia**. It is in
**beta**: the system is being built, but the community's real content does not
exist yet. Do not fabricate it.

## Golden rule
Build the system, not a pretend community. Never invent events, members,
statistics, testimonials, sponsors, partnerships, or "real-looking" links.
See `docs/content.md` for the full placeholder contract.

## Content rules
- All external links and community details are placeholders until launch.
- Every placeholder value MUST be exactly `REPLACE_BEFORE_LAUNCH`.
- Unavailable community links display the literal text "Coming soon".
- Lists that have no beta data (events, gallery, guides, announcements,
  crew listings) render a real empty state, never sample/fake entries.
- Do not turn placeholder links into clickable real-looking URLs.

---

## 1. Exact stack & architecture map

### Dependencies (verified from `package.json`) — do not substitute
- **Framework:** Next.js 16.4.6 (App Router), React 19.3, TypeScript 6 (strict)
- **Styling:** Tailwind CSS 4.3.5 via `@tailwindcss/postcss`. **No UI kit, no
  component library.** Theme tokens live in `src/app/globals.css` under `@theme`.
- **Database/Auth/Storage:** Supabase — `@supabase/supabase-js` +
  `@supabase/ssr` (SSR client in `src/lib/supabase/server.ts`, service-role in
  `src/lib/supabase/admin.ts` which is `server-only`)
- **Validation:** Zod 4 (`src/lib/*/validation.ts`, `src/lib/m8/validation.ts`)
- **Markdown:** `react-markdown` + `remark-gfm` (guides/announcements bodies).
  Never `dangerouslySetInnerHTML`.
- **Motion:** GSAP (`src/components/scroll/`)
- **3D:** `three` + `@react-three/fiber` — code exists in
  `src/components/three/` but is **NOT mounted** in the current design. Do not
  mount it without an explicit request.
- **Bots:** `discord.js` (dev dependency), scripts in `scripts/*.mjs`
- **Hosting:** Vercel (`vercel.json`: security headers + crons)

### Scripts
`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `supabase:start|stop|status|reset|test`,
`bot:webrole`, `bot:announcements`

### Environment variables (names only — values live in `.env.local`, never commit)
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
`DISCORD_EVENTS_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`,
`DISCORD_ADMIN_ROLE_ID`, `DISCORD_OWNER_ROLE_ID`, `DISCORD_COMMAND_SECRET`,
`SUPABASE_DB_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
`BOOTSTRAP_ADMIN_DISCORD_IDS`

### Supabase tables (23 real tables; 33 migrations in `supabase/migrations/`)
`profiles`, `user_roles`, `user_consents`, `announcements`, `guides`,
`gallery_items`, `comments`, `reports`, `moderation_actions`, `audit_log`,
`crew_listings`, `crew_applications`, `events`, `event_hosts`, `event_rsvps`,
`official_updates`, `discord_events`, `discord_announcements`, `site_settings`,
`site_layout_config`, `sync_state`, `official_events`, `official_event_exceptions`.

> **`partner_events` was DROPPED in `0016_discord_events.sql` and is
> referenced nowhere in `src/`.** It is dead. Do not recreate it, and do not
> trust older docs that mention it.

RLS is enabled on every table (policies in `0004` onward, hardened in `0013`).

Official Sea of Thieves events live in `official_events` (migrations `0034`–`0035`),
deliberately separate from community `events`. Dated events use
`starts_at`/`ends_at`; recurring events store a `recurrence` jsonb rule
(`{"kind":"weekly","weekday":2,"startTime":"10:00","durationMinutes":null}`),
so a newly launched official event never needs an enum change.
`official_event_exceptions` skips a single occurrence (holiday, cancellation).

Public read projections (RLS-safe views used by anonymous pages):
`public_profiles` and `public_crew_listings` (migration `0031`). The crew view
omits `contact_method` / `contact_consent`, so visitors can browse open crews
without contact details reaching the browser. `crew_listings` itself stays
members-only.

### Storage buckets (4 — verified in migrations)
| Bucket | Public | Purpose |
|---|---|---|
| `avatars` | no | Per-user avatars, owner-scoped paths |
| `gallery` | no | Gallery uploads; public read only for approved rows |
| `covers` | yes | Announcement covers (moderators+) |
| `media` | yes | Events / crew / guide images (any signed-in member) |

### Roles & RPCs
Roles: `member`, `moderator`, `admin`, `owner` (`user_roles`). `owner` is
implicitly admin (migrations `0018`, `0020`).
Auth helpers in `src/lib/m8/auth.ts`: `requireUser`, `requireModerator`,
`requireAdmin`, `requireOwner`, plus `logAudit`.
Key RPCs: `is_admin`, `is_moderator`, `is_owner_role`, `is_event_host`,
`has_role`, `admin_set_role`, `log_admin_action`, `moderate_crew_listing`,
`moderate_report`, `submit_report`, `delete_my_account`,
`sync_discord_member_role`, `handle_new_user`, `set_updated_at`.

### Routes — pages (real files under `src/app/`)
- **Public group `src/app/(public)/`:** `/events`, `/events/[id]`,
  `/events/new`, `/events/[id]/edit`, `/events/manage`, `/crew`,
  `/crew/[id]`, `/crew/new`, `/crew/[id]/edit`, `/guides`, `/guides/[id]`,
  `/guides/new`, `/guides/[id]/edit`, `/gallery`, `/gallery/[id]`,
  `/gallery/upload`, `/announcements`, `/announcements/[id]`,
  `/announcements/new`, `/announcements/[id]/edit`, `/moderation`, `/report`
- **Admin:** `/admin`, `/admin/control`, `/admin/users`, `/admin/reports`,
  `/admin/gallery`, `/admin/guides`, `/admin/announcements`, `/admin/settings`
- **Other:** `/` (home), `/login`, `/profile`, `/settings`, `/tools`,
  `/privacy`, `/terms`, `/conduct`, `/security`, `/data-request`,
  `/admin/master` (master control panel)

> **There is no `/news` route.** The navigation label "News" points to
> **`/announcements`** (`NAV_LINKS` in `src/lib/content/site-config.ts`).
> Never invent a `/news` page; extend `/announcements`.

### API routes (37, all under `src/app/api/`)
`account/delete`, `admin/audit`, `admin/control`, `admin/control/delete`,
`admin/official-updates`, `admin/people`, `admin/reports`, `admin/roles`,
`announcements`, `announcements/[id]`, `comments`, `comments/[id]`,
`content/image`, `crew`, `crew/[id]`, `crew/[id]/report`,
`cron/official-news`, `cron/sync-discord-roles`, `cron/sync-partner`,
`discord/announcements`,
`discord/events`, `discord/role-command`, `events`, `events/[id]`,
`events/[id]/rsvp`, `events/[id]/status`, `gallery`, `gallery/[id]`, `guides`,
`guides/[id]`, `health`, `moderation/crew`, `profile`, `reports`,
`sync/official-sot`, `webhooks/discord`.
The only scheduled job is `/api/cron/official-news` (daily, `0 3 * * *`).
`/api/cron/sync-partner` and `/api/sync/official-sot` remain as manual triggers
and must not be added back to `vercel.json` — see §6.

### Feature wiring (do not disconnect)
- **Home** (`src/app/page.tsx`): hero video backdrop (`.hero-section` +
  `VideoLayer variant="hero"`, `/media/sot1-hero.mp4`), then the cinematic
  **Horizon → Fleet → Tavern** sequence (`src/components/sections/cinematic-voyage.tsx`,
  copy in `CINEMATIC` in `site-config.ts`), then owner-ordered sections
  (`site_layout_config.home_sections`, drag-reorder in `/admin/master` and
  `/admin/control`), live board, official news, Discord board, previews, join
  CTA, GSAP scroll progress + pointer-glow (`HoverGlowController`, `data-glow`).
  The three scene keys (`horizon`, `fleet`, `tavern`) are ordinary homepage
  section keys — they can be reordered or hidden like any other.
- **Cinematic scenes** stay cheap on purpose: the still JPG is always the base
  layer, the matching `-motion.mp4` is attached lazily by `IntersectionObserver`
  only when the visitor allows it (`prefers-reduced-motion`, Save-Data and 2G
  all skip video), parallax is GSAP/ScrollTrigger with per-scene travel, and the
  component reverts its context on unmount. **There is no global page video
  layer any more** (`sot2-page.mp4` was removed); do not re-add a fixed
  full-page video, it is what used to hide the footer.
- **Events:** calendar + countdowns, RSVPs, host authorization
  (`is_event_host` includes admin/moderator/owner). Table `events`
  (has `image_url`), `event_rsvps`, `event_hosts`.
- **Crew / LFG:** listings + applications + moderation queue.
  `crew_listings` (has `image_url`), `crew_applications`. Public pages read
  `public_crew_listings`; `listCrewListings` also drops full crews and expired
  listings so a stale crew is never shown as available.
- **Homepage previews** (`src/components/home/home-previews.tsx`): live rows for
  events, crew, gallery and guides, falling back to that section's empty state.
  No hardcoded sample content.
- **Time system:** `src/lib/time/zone.ts` is the single source of truth
  (`getEventStatus`, `formatInTimeZone`, `convertLocalInputToUtc`,
  `getTimeZoneOffsetLabel`, `TIME_ZONE_OPTIONS`). UTC is the default; the
  browser zone is never auto-applied. `TimeZoneProvider`
  (`src/components/system/time-zone-provider.tsx`) holds the visitor's choice
  from the `sot_tz` cookie / `localStorage`, and mirrors it to
  `profiles.timezone` via `POST /api/profile/timezone` when signed in.
  `LocalTime` renders in that zone; `RegionClock` ticks once per second. Do not
  add a second date-conversion path in a component.
- **Realtime:** `LiveRefresh` (`src/components/system/live-refresh.tsx`)
  subscribes to `postgres_changes` on events, announcements, crew listings,
  gallery and guides, then calls `router.refresh()`. Migration `0032` added
  those tables to the `supabase_realtime` publication. A 2-minute poll is the
  fallback when the socket does not connect. The CSP in `next.config.ts` and
  `vercel.json` must allow `wss://*.supabase.co` or this silently breaks.
- **Guides:** moderator-authored markdown; `guides.body`, `guides.image_url`.
- **Gallery:** uploads to bucket `gallery`, moderator approval at
  `/admin/gallery`; `gallery_items`.
- **Announcements:** native cards, optional cover (`covers` bucket),
  pinned/status; `announcements.cover_image_url`.
- **Typography:** the whole site is set in **Windlass**
  (`src/app/fonts/Windlass.ttf`, loaded with `next/font/local` in
  `src/app/layout.tsx`, exposed as `--font-windlass`). `--font-sans` and
  `--font-display` both point at it, so there is one typeface and no
  `font-mono` anywhere. Three consequences to keep in mind:
  - The file ships **one weight (400)**. `font-synthesis-weight: none` is set on
    `body` on purpose: a synthetic bold smears the strokes. Headings earn their
    hierarchy from size, tracking and colour, never from `font-weight` alone —
    do not "fix" a flat-looking heading by adding weight.
  - Lowercase glyphs are small capitals, so ordinary sentence-case copy reads
    as small caps. `p` carries `line-height: 1.72` and `body` a little
    `letter-spacing` because the face runs wide and tall.
  - The file has no glyphs for `—`, `·`, `…`, `°` or `×`. Those fall back to
    Georgia/Palatino and look slightly lighter; it is expected, not a bug.
    Prefer phrasing that avoids them in new copy, but do not strip them from
    existing content.

- **Branding:** `public/brand/logo-asia.png` is the owner-supplied gold
  "Sea of Thieves asia" lockup (644x456, transparent, shadow baked in). It is
  rendered only through `BrandLockup` (header with `priority`, footer with
  `size="lg"`) and `/login` (`login-logo`); do not inline a second copy of the
  path in a new component. The hero deliberately does **not** repeat it — the
  owner asked for the mark to stay in the chrome, and the `h1` already names the
  community. `src/app/icon.png`, `apple-icon.png` and `opengraph-image.png` are
  that same file centred on `#0b1120` — regenerate them from the master rather
  than drawing new marks. Keep the non-affiliation wording in the hero eyebrow
  and the footer: the mark names a game this community does not own.

- **Official news:** `src/lib/official/sync.ts` fetches
  seaofthieves.com/news, dedupes by slug, upserts `official_updates`
  (`source`, `featured`, `hidden`). Manual button → `POST /api/sync/official-sot`
  (admin session or `Bearer CRON_SECRET`); **daily** cron in `vercel.json`
  (Hobby plan rejects sub-daily schedules).
  Feature/hide via `/api/admin/official-updates`.
- **Official next event:** `src/lib/official/event-sync.ts` reads
  `seaofthieves.com/event-hub` and upserts `official_events`. The same job runs
  from the one daily cron. `src/lib/official/event-queries.ts` expands the rules
  and picks what is live and what is next; `NextOfficialEvent` renders it after
  the hero on `/` and above the lists on `/events`, with a 1-second client
  countdown in the visitor's `sot_tz` zone. The hub is read twice, for two
  different jobs:
  - The **markup** (`event-hub.ts`) for headings, date wording and status
    flags — the visible, published words.
  - The **serialised JSON** the page ships (`hub-data.ts`). This is the only
    place card artwork and exact UTC boundaries exist: the markup leaves every
    `event-panel-inner__image` empty and paints it client-side, so scraping
    markup alone never yields an image.
  Artwork is copied into the public `covers` bucket at
  `official/<external_id>.jpg` and `artwork_url` points at storage;
  `artwork_source` keeps the official CDN URL so a changed picture is re-copied.
  If the copy fails, the official URL is stored instead (the CSP already allows
  `*.azureedge.net`). Rules that matter:
  - An event with no readable official date is never stored, never guessed. A
    prose date we cannot parse may be rescued by the JSON's `StartDate`/
    `EndDate`, never by inference.
  - `official_events` rows survive a failed sync; only a successful read writes.
  - A dated Last Ship Standing suppresses the Fight Night it replaces
    (`SUPPRESSION_RULES`); nothing else is suppressed.
  - `tier = 'ambient'` (Gold Rush) never outranks a headline event.
  - Events without a published end are shown as "End time not published".
- **Owner control center** (`/admin/control`): feature flags, Discord channel
  config, outgoing webhook, homepage order, official sync, master delete.
  Persists to `site_settings`, every change audit-logged.
- **Master control** (`/admin/master`): layout engine + kill switches.
  `src/lib/site/layout.ts` reads `site_layout_config` (`home_sections`,
  `nav_order`, `kill_switches`); `src/lib/admin/content.ts` exposes universal
  content CRUD (`sort_order` / `is_enabled` / `is_featured` on the six content
  tables). Kill switches (`maintenanceMode`, `crewSubmissions`,
  `galleryUploads`, `officialSync`, `discordAutoPost`) are enforced
  server-side in the matching API routes, not just hidden in the UI.
  `0028_master_control.sql` also grants `*_master_admin_all` RLS overrides and
  protects the owner role (`admin_set_role` + `is_owner_user`).
- **Tools** (`/tools`): voyage checklist.
- **Profile/settings:** consent + account deletion (`/api/account/delete`).

### Discord integrations (all directions)
- **Login:** Supabase auth provider `discord`; callback
  `src/app/auth/callback/route.ts`.
- **Discord → Website:** `/api/discord/events` and
  `/api/discord/announcements` (`Authorization: Bearer
  DISCORD_EVENTS_SECRET`), plus the unified `/api/webhooks/discord`
  (`x-discord-secret` header) accepting `{type:"events"|"announcement",...}`.
  Tables `discord_events`, `discord_announcements`.
- **Website → Discord:** `src/lib/discord/notify.ts` posts rich embeds to the
  webhook at `site_settings.discord.outgoingWebhookUrl`. Fires on published
  announcements, new events, new crew listings. Never blocks the DB write.
- **Channel feed:** runtime-registered via `/sotafeed` slash command
  (`npm run bot:announcements`). **Channels are stored in
  `site_settings.discord.channels` JSONB — there is NO `discord_channels`
  table.** Never hard-code channel IDs in the site.
- **Roles:** manual `/webrole set @member owner` (`npm run bot:webrole`,
  `/api/discord/role-command`). Auto 15-min sync is disabled by design;
  `/api/cron/sync-discord-roles` exists for manual bulk sync only.

### Server/client boundary rules
- Data fetching happens in Server Components / route handlers using
  `src/lib/supabase/server.ts`. `src/lib/supabase/admin.ts` is `server-only`
  and must never be imported from a `"use client"` file.
- All mutations go through API routes with Zod validation — never call the
  database directly from the browser.
- Secrets exist only in `.env.local` / server env. Never print, commit, or
  embed them. Missing env values must **fail closed**, not open.
- All user-supplied content is rendered as text or markdown, never as raw HTML.

---

## 2. Anti-AI-slop mandate (non-negotiable)
Every component must look and feel like an authentic, tactile maritime/pirate
community logbook and live tactical companion — never a generic SaaS template.

**Banned:**
- Generic SaaS boilerplate (hero + 3 feature cards + pricing + CTA).
- Purple/blue glow gradients, rainbow neon accents, glassmorphism fads.
- Stock/filler copy ("Lorem ipsum", "Your journey starts here",
  "Empowering communities") and fake or hardcoded statistics.
- Bloated third-party UI widget plugins (component kits, embed scripts,
  tracker SDKs). This project hand-rolls its UI with Tailwind CSS 4 only.
- Unnecessary wrapper libraries around what Next.js, React, Supabase or GSAP
  already do natively.
- Emoji used as decoration instead of real design work.
- Repeated, identical card grids with no hierarchy or domain character.

**Required:**
- Bespoke, domain-authentic treatment for every new screen/section/component:
  nautical materials, ship's-log and chart metaphors, restrained colour,
  deliberate typography. Reuse the `@theme` tokens in `src/app/globals.css`
  and the primitives in `src/components/ui/` before inventing anything.
- Copy in the community's own voice (Sea of Thieves slang used sparingly and
  naturally), never in marketing filler.
- Motion that is subtle and purposeful (GSAP micro-interactions, pointer glow,
  scroll progress). No decorative noise, no heavy parallax.
- Never replace the established dark maritime theme, and never delete working
  features while refactoring. Improve deliberately; never "template" it.

---

## 3. Core feature standards

### Images: Supabase Storage URLs only
- **Never store base64 in Postgres.** Upload bytes to Storage, store the
  resulting **public URL** in the row.
- All image uploads/pastes go through the shared component
  `src/components/MediaPasteUploader.tsx` (clipboard `Ctrl+V`, drag-and-drop,
  file picker, instant preview, remove). It POSTs to `/api/content/image`.
- Bucket choice: `covers` (moderators+) or `media` (any signed-in member).
  Accepted: JPEG/PNG/WebP/GIF, max 5 MB (gallery has its own larger limits).
- Column names: `events.image_url`, `crew_listings.image_url`,
  `guides.image_url`, `announcements.cover_image_url`.
- Every new form that accepts an image MUST reuse `MediaPasteUploader` rather
  than hand-rolling an `<input type="file">`.

### Real data binding
- Every list, card, counter and stat on a page must read live Supabase data
  (Server Component query or route handler). No hardcoded arrays standing in
  for database content, no invented numbers.
- Empty states are honest: when there is no data, render the existing empty
  state components — never demo rows to "make it look full".
- Respect the feature flags in `site_settings.features` for nav and homepage
  sections.

### Layout: no dead scroll space, footer always visible
- The shell is `<body class="flex min-h-dvh flex-col overflow-x-clip">` with
  `<main class="flex-1">` and a `mt-auto` footer. **Keep `min-h-dvh`** (never
  `min-h-screen`) and never add a second full-viewport wrapper.
- The footer must stay visible above decorative fixed layers: the page video
  layer is `fixed inset-0 z-0` and the footer is `relative z-10`. **Any new
  full-screen background/video/canvas layer must stay at `z-0` and must not
  paint over the footer.**
- No stray `pb-*`/`mb-*` spacers or empty divs at the end of a page. Scrolling
  must stop exactly at the bottom of the footer.

---

## 4. Working rules
- Follow existing conventions and architecture patterns; match surrounding code.
- Do not add dependencies without need; prefer the platform.
- Keep brand decisions in `docs/brand.md`, asset licensing in
  `docs/assets.md`, content contract in `docs/content.md`.
- Project agent skills live in `.agents/skills/` (React/Next best practices,
  frontend design & anti-slop taste, Tailwind 4, Supabase + Postgres, web
  accessibility & quality). Consult the relevant skill before large UI, data,
  or accessibility work. `.agents/**` and `.pi/**` are vendored/tooling and
  excluded from lint.
- When in doubt, consult `README.md` and `docs/` before writing code.

---

## 5. Mandatory git & build safety gate

**Before any major edit:** create a local checkpoint.

```bash
git status                      # confirm .env / .env.local / node_modules ignored
git add -A && git commit -m "checkpoint: <short description>"
```

Never commit secrets. `.gitignore` must keep ignoring `.env`, `.env*.local`,
`.vercel`, `node_modules/`, `.next/`, `*.tsbuildinfo`.

**Before finishing any task** (inside WSL; Node comes from nvm, loaded by
`~/.profile` in non-interactive shells):

```bash
npx tsc --noEmit && npm run build
```

Both must pass with **zero errors**. For UI changes also run `npm run lint`,
boot the app (`npm run dev`, with `npx supabase start` running) and verify the
affected pages/APIs return 200 and behave correctly. After migrations or RLS
changes run `npx supabase db reset && npm run supabase:test`. Never finish with
a failing build, skipped type errors, or untested "should work" claims.

---

## 6. Live deployment (auto-publish)

Production: **https://sea-of-thieves-asia.vercel.app**
(project `sea-of-thieves-asia`, Vercel org `kohi6`; private GitHub repo
`Apologiesm/sea-of-thieves-asia`, branch `main`).

Hosted Supabase: project ref **`yszetsslwuegqexkajph`**, region
`ap-southeast-1`, URL `https://yszetsslwuegqexkajph.supabase.co`
(dashboard: https://supabase.com/dashboard/project/yszetsslwuegqexkajph).
All 26 migrations are applied there. Vercel holds the hosted URL + anon +
service-role + DB URL in both Production and Preview.

Supabase Auth: Site URL `https://sea-of-thieves-asia.vercel.app`, allowed
redirects `https://sea-of-thieves-asia.vercel.app/auth/callback`,
`http://localhost:3000/auth/callback`, and Vercel preview hosts.
Discord OAuth2 redirect to register: `https://yszetsslwuegqexkajph.supabase.co/auth/v1/callback`.

`/api/health` must return `{"status":"ok"}`.

**When the user says "publish" or "update live site", do this automatically —
no further confirmation needed:**

```bash
npx tsc --noEmit && npm run build     # must pass first
git add -A
git commit -m "deploy: <what changed>"
git push origin main
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which rebuilds and
deploys to `https://sea-of-thieves-asia.vercel.app` automatically. Then verify:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://sea-of-thieves-asia.vercel.app/
```

Rules:
- Never push if the type-check or build fails.
- Never commit `.env.local`, `.vercel`, or any secret.
- Commit author must stay `Sea of Thieves Asia <akib.islam20071@gmail.com>`
  (the Vercel team member). A different author email makes Vercel block the
  deployment with `TEAM_ACCESS_REQUIRED`.
- Manual deploy if Actions is unavailable: `npx vercel@latest --prod --yes`.
- Cron schedules in `vercel.json` must stay **daily** on the Vercel Hobby plan
  (sub-daily expressions fail the build).

---

## Definition of done
- No invented community content anywhere in the codebase.
- Placeholders clearly marked and behaving as the content contract says.
- Images stored as Storage URLs, never base64.
- Footer visible with zero dead scroll space below it.
- A checkpoint commit exists, and the build/type gate has actually been run and
  passed.
