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
`dev`, `build`, `start`, `lint`, `typecheck`, `supabase:start|stop|status|reset|test`,
`bot:webrole`, `bot:announcements`

### Environment variables (names only — values live in `.env.local`, never commit)
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
`DISCORD_EVENTS_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`,
`DISCORD_ADMIN_ROLE_ID`, `DISCORD_OWNER_ROLE_ID`, `DISCORD_COMMAND_SECRET`,
`SUPABASE_DB_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
`BOOTSTRAP_ADMIN_DISCORD_IDS`

### Supabase tables (19 real tables; 25 migrations in `supabase/migrations/`)
`profiles`, `user_roles`, `user_consents`, `announcements`, `guides`,
`gallery_items`, `comments`, `reports`, `moderation_actions`, `audit_log`,
`crew_listings`, `crew_applications`, `events`, `event_hosts`, `event_rsvps`,
`official_updates`, `discord_events`, `discord_announcements`, `site_settings`.

> **`partner_events` was DROPPED in `0016_discord_events.sql` and is
> referenced nowhere in `src/`.** It is dead. Do not recreate it, and do not
> trust older docs that mention it.

RLS is enabled on every table (policies in `0004` onward, hardened in `0013`).

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
  `/privacy`, `/terms`, `/conduct`, `/security`, `/data-request`

> **There is no `/news` route.** The navigation label "News" points to
> **`/announcements`** (`NAV_LINKS` in `src/lib/content/site-config.ts`).
> Never invent a `/news` page; extend `/announcements`.

### API routes (35, all under `src/app/api/`)
`account/delete`, `admin/audit`, `admin/control`, `admin/control/delete`,
`admin/official-updates`, `admin/people`, `admin/reports`, `admin/roles`,
`announcements`, `announcements/[id]`, `comments`, `comments/[id]`,
`content/image`, `crew`, `crew/[id]`, `crew/[id]/report`,
`cron/sync-discord-roles`, `cron/sync-partner`, `discord/announcements`,
`discord/events`, `discord/role-command`, `events`, `events/[id]`,
`events/[id]/rsvp`, `events/[id]/status`, `gallery`, `gallery/[id]`, `guides`,
`guides/[id]`, `health`, `moderation/crew`, `profile`, `reports`,
`sync/official-sot`, `webhooks/discord`.
Note: `/api/cron/sync-partner` actually runs the **official news** sync
(`syncOfficialUpdates`), not partner events.

### Feature wiring (do not disconnect)
- **Home** (`src/app/page.tsx`): hero video backdrop, owner-ordered sections
  (`site_settings.home.sectionOrder`, drag-reorder in `/admin/control`), live
  board, official news, Discord board, previews, join CTA, GSAP scroll progress
  + pointer-glow (`HoverGlowController`, `data-glow`).
- **Events:** calendar + countdowns, RSVPs, host authorization
  (`is_event_host` includes admin/moderator/owner). Table `events`
  (has `image_url`), `event_rsvps`, `event_hosts`.
- **Crew / LFG:** listings + applications + moderation queue.
  `crew_listings` (has `image_url`), `crew_applications`.
- **Guides:** moderator-authored markdown; `guides.body`, `guides.image_url`.
- **Gallery:** uploads to bucket `gallery`, moderator approval at
  `/admin/gallery`; `gallery_items`.
- **Announcements:** native cards, optional cover (`covers` bucket),
  pinned/status; `announcements.cover_image_url`.
- **Official news:** `src/lib/official/sync.ts` fetches
  seaofthieves.com/news, dedupes by slug, upserts `official_updates`
  (`source`, `featured`, `hidden`). Manual button → `POST /api/sync/official-sot`
  (admin session or `Bearer CRON_SECRET`); hourly cron in `vercel.json`.
  Feature/hide via `/api/admin/official-updates`.
- **Owner control center** (`/admin/control`): feature flags, Discord channel
  config, outgoing webhook, homepage order, official sync, master delete.
  Persists to `site_settings`, every change audit-logged.
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

**Before any major edit:** create a local checkpoint and never push unless asked.

```bash
git status                      # confirm .env / .env.local / node_modules ignored
git add -A && git commit -m "checkpoint: <short description>"
```

Never commit secrets. `.gitignore` must keep ignoring `.env`, `.env*.local`,
`node_modules/`, `.next/`, `*.tsbuildinfo`.

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

## Definition of done
- No invented community content anywhere in the codebase.
- Placeholders clearly marked and behaving as the content contract says.
- Images stored as Storage URLs, never base64.
- Footer visible with zero dead scroll space below it.
- A checkpoint commit exists, and the build/type gate has actually been run and
  passed.
