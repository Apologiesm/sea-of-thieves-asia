# AGENTS.md — Sea of Thieves Asia

Instructions for AI coding agents working in this repository.

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
  crew listings) are marked `EMPTY_FOR_BETA` and render an empty state,
  never sample/fake entries.
- Do not turn placeholder links into clickable real-looking URLs.

## Anti-AI-slop mandate (non-negotiable)
Every component must look and feel like an authentic, tactile maritime/pirate
community logbook and live tactical companion — never like a generic SaaS
template.

**Banned:**
- Generic SaaS boilerplate layouts (hero + 3 feature cards + pricing + CTA).
- Overused purple/blue glow gradients and rainbow neon accents.
- Stock placeholder copy ("Lorem ipsum", "Your journey starts here",
  "Empowering communities") and fake or hardcoded statistics.
- Bloated third-party UI widget plugins (component kits, embed scripts,
  tracker SDKs). This project hand-rolls its UI with Tailwind CSS 4 only.
- Unnecessary wrapper libraries around things Next.js, React, Supabase, or
  GSAP already do natively.
- Emoji decoration standing in for real design work.

**Required:**
- Every new screen, section, and component has a bespoke, domain-authentic
  treatment: nautical/maritime materials, ship's-log and chart metaphors,
  restrained color, deliberate typography. Reuse the existing theme tokens in
  `src/app/globals.css` and the shared primitives in `src/components/ui/`
  before inventing anything new.
- Copy is written in the community's own voice (Sea of Thieves crew slang used
  sparingly and naturally), never in marketing filler.
- Motion is subtle and purposeful (GSAP micro-interactions, pointer glow,
  scroll progress) — decorative noise and heavy parallax are out.
- Never change the existing visual design/theme or delete working features
  while refactoring. Match what is on screen; improve it deliberately, never
  "template" it.

## Exact stack (do not substitute)
- **Framework:** Next.js 16 App Router, React 19, TypeScript (strict), Zod 4
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/postcss`), no UI kit
- **Database/Auth/Storage:** Supabase (local dev via `npx supabase start`,
  PostgREST + RLS on every table; SSR client `@supabase/ssr`)
- **Motion:** GSAP; **3D (unmounted):** three / @react-three/fiber
- **Discord:** discord.js bots (`npm run bot:webrole`, `npm run
  bot:announcements`), OAuth login via Supabase auth provider
- **Hosting:** Vercel (`vercel.json` headers + cron)

## Complete domain & feature map (do not disconnect or delete)
Read `README.md` for deep detail on any item below. Every route, API path, and
table listed here is real wiring — check usages before touching it.

### Supabase tables (migrations in `supabase/migrations/`, RLS in 0004+)
`profiles`, `user_roles` (member/admin/owner; owner auto-admin via 0018/0020),
`user_consents`, `announcements`, `guides`, `gallery_items` (Storage bucket
`gallery`, covers bucket `covers`), `comments`, `reports`,
`moderation_actions`, `audit_log`, `crew_listings`, `crew_applications`,
`events`, `event_hosts`, `event_rsvps`, `partner_events`, `official_updates`,
`discord_events`, `discord_announcements`, `discord_channels`,
`site_settings` (owner control center, homepage section order 0026).

### Pages & features
- **Home** (`src/app/page.tsx`): hero video backdrop, owner-ordered sections
  (drag-reorder via `/admin/control`), Discord event board, official news feed,
  live community previews, join CTA. Pointer-glow cards, GSAP scroll progress
  (`src/components/scroll/`).
- **Events** (`src/app/(public)/events*`): full calendar + countdowns,
  authorized hosts create (`/events/new`) and manage status/RSVPs
  (`/events/manage`); tables `events`, `event_rsvps`, `event_hosts`.
- **Crew / LFG tavern board** (`src/app/(public)/crew*`): crew listings with
  join applications and moderation queue; tables `crew_listings`,
  `crew_applications`.
- **Guides** (`src/app/(public)/guides*`): moderator-authored markdown guides
  (`guides.body`, rendered with react-markdown, never raw HTML).
- **Gallery** (`src/app/(public)/gallery*`): member uploads to Storage bucket
  `gallery`, moderator approval at `/admin/gallery`.
- **Announcements** (`src/app/(public)/announcements*`): native cards with
  optional cover images (bucket `covers`).
- **Discord integrations:**
  - Login: Supabase auth provider `discord` (`src/app/auth/callback/route.ts`).
  - Event feed: bot POSTs to `/api/discord/events` (Bearer
    `DISCORD_EVENTS_SECRET`); table `discord_events`.
  - Unified ingestion: `/api/webhooks/discord` with `x-discord-secret:` header
    accepts both `{type:"events",events:[...]}` and
    `{type:"announcement",announcement:{...}}` payloads.
  - Outbound: website -> Discord embeds via `src/lib/discord/notify.ts`, using
    the outgoing webhook URL stored in `site_settings.discord
    .outgoingWebhookUrl`; fires on published announcements, new events and new
    crew listings.
  - Announcements feed: bot POSTs to `/api/discord/announcements`; channels
    registered at runtime with the `/sotafeed` slash command
    (`npm run bot:announcements`, script `scripts/discord-announcements-bot.mjs`);
    tables `discord_announcements`, `discord_channels`. Never hard-code
    channel IDs in the site; they are runtime data.
  - Manual role command: `/webrole set @member owner` (`npm run bot:webrole`,
    `scripts/discord-webrole-bot.mjs`, API `/api/discord/role-command`).
    Auto 15-minute role sync is disabled by design;
    `/api/cron/sync-discord-roles` exists for manual bulk sync only.
- **Owner control center** (`/admin/control`, owner-only): maintenance toggles
  per section, Discord channel config, homepage drag-reorder, global content
  deletion. Persists to `site_settings`, every change audit-logged.
- **Admin/moderation** (`/admin/*`, `/moderation`): users & roles
  (`/api/admin/roles`, `/api/admin/people`), reports
  (`/api/admin/reports`, `/api/reports`), gallery moderation, audit log view
  (`/api/admin/audit`), settings (`/api/admin/control`).
- **Official game news** (`src/lib/official/sync.ts`,
  `/api/cron/sync-partner` cron in `vercel.json`, protected by `CRON_SECRET`).
  Owner can sync on demand from `/admin/control` via `POST /api/sync/official-sot`
  (hourly cron registered in `vercel.json`), and feature/hide rows through
  `/api/admin/official-updates`. Table `official_updates` carries the
  `source: 'official'` badge plus `featured`/`hidden` flags that syncs never
  overwrite.
- **Tools** (`/tools`): Voyage checklist utility.
- **Profile/settings** (`/profile`, `/settings`): consent + account deletion
  (`/api/account/delete`, `/api/profile`).
- **Policies:** `/privacy`, `/terms`, `/conduct`, `/security`,
  `/data-request` — static, keep links in footer config.
- **Destructive/sensitive API routes** (all auth-checked server-side, never
  client-trusted): `/api/events/[id]`, `/api/gallery/[id]`, `/api/guides/[id]`,
  `/api/announcements/[id]`, `/api/comments/[id]`, `/api/crew/[id]`,
  `/api/moderation/crew`, `/api/admin/*`, `/api/content/image`.
- **Universal image uploader:** `src/components/MediaPasteUploader.tsx`
  (paste / drag-drop / picker) is wired into every creation/edit form: events
  (`events.image_url`), crew (`crew_listings.image_url`), guides
  (`guides.image_url`), announcements (`announcements.cover_image_url`),
  gallery preview, and admin controls. Uploads go through
  `/api/content/image` to the `covers` (moderators) or `media`
  (any signed-in member) Storage buckets; rows store the public URL only,
  never base64.

### Server/client boundary rules
- Data fetching happens in Server Components / route handlers using
  `src/lib/supabase/server.ts`; `src/lib/supabase/admin.ts` is `server-only`
  (service role) and must never be imported from a `"use client"` file.
- All mutations go through API routes with Zod validation
  (`src/lib/*/validation.ts`) — never call the database directly from the
  browser.
- Secrets live only in `.env.local` / server env. Never print, commit, or
  embed them. Missing env values must fail closed, not open.

## Working rules
- Follow existing coding conventions and architecture patterns.
- Reuse the project's tooling for common tasks; do not add dependencies
  without need.
- Keep brand decisions in `docs/brand.md` and asset decisions in
  `docs/assets.md`.
- Project agent skills live in `.agents/skills/` (React/Next best practices,
  frontend design & anti-slop taste, Tailwind 4, Supabase + Postgres, web
  accessibility & quality). Consult the relevant skill before large UI, data,
  or accessibility work.
- When in doubt, consult the docs before writing code.

## Verification gate (mandatory before finishing any task)
Run inside WSL from the project root (Node comes from nvm; `~/.profile` loads
it in non-interactive shells):

```bash
npx tsc --noEmit && npm run build
```

Both must pass with **zero errors** before you report done. For UI changes,
also run `npm run lint`, boot the app (`npm run dev` with `npx supabase start`
already running) and verify the affected pages/APIs return 200 and behave
correctly. `supabase db reset` + `npm run supabase:test` when migrations or
RLS changed. Never finish with a failing build, skipped type errors, or
untested "should work" claims.

## Definition of done
- No invented community content anywhere in the codebase.
- Placeholders are clearly marked and behave as the content contract says.
- The site builds and runs with empty community data.
- Verification gate above has actually been executed and passed.
