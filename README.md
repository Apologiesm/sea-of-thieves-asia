# Sea of Thieves Asia — Community Platform

Unofficial fan community platform for Sea of Thieves players across Asia.
Built with Next.js 16 App Router, TypeScript, Tailwind CSS, Supabase, GSAP,
React Three Fiber components (currently not mounted), and Zod.

> Sea of Thieves Asia is an unofficial fan community and is not affiliated with,
> endorsed by, or connected to Rare, Xbox, or Sea of Thieves.

## Exact install / run / build commands

```bash
cd ~/projects/sea-of-thieves-asia
npm install
npm run dev          # http://localhost:3000
npm run build
npm run typecheck
npm run lint
```

Local Supabase:

```bash
npx supabase init    # already initialised; safe to re-run
npx supabase start
npx supabase status
npx supabase db reset
npx supabase stop
npx supabase db test
```

Copy `.env.example` to `.env.local` and fill from `npx supabase status`.
**Never commit `.env.local`.** Supabase CLI is a project dependency; no global
install is required.

## Where to change placeholder links

All public links live in **`src/lib/content/site-config.ts`**:
- `SOCIAL_LINKS` — Discord, YouTube, Twitch, X, Instagram, Facebook, TikTok, contact
- `JOIN_CTA.linkValue` — the Discord invite CTA
- `LIVE_SEAS` / `EVENT_FORMATS` — live board copy and event-format timings
- `FOOTER.columns` — footer links including policy pages and Discord channels

The content contract is **`docs/content.md`**. Any value not supplied by the
owner must remain `REPLACE_BEFORE_LAUNCH`. Missing community links render as
disabled "Coming soon" text, never fake URLs.

Security contact: `SECURITY_CONTACT_EMAIL` in `site-config.ts` is currently
`REPLACE_BEFORE_LAUNCH`.

## Where to edit content

| Content | Where |
|---|---|
| Home/hero/about text | `src/lib/content/site-config.ts` (`HERO`, `ABOUT`, `FEATURES`, `PREVIEWS`) |
| Live Seas board | `src/components/live/LiveSeas.tsx`, `src/lib/live/queries.ts`, `LIVE_SEAS` / `EVENT_FORMATS` in `site-config.ts` |
| Discord event board | `src/app/api/discord/events/route.ts`, `src/components/discord/DiscordEvents.tsx` |
| Official game news | `src/lib/official/sync.ts`, `src/components/official/OfficialUpdates.tsx`, migration `0015_official_updates.sql` |
| Event calendar + countdown | `src/components/event/EventCalendar.tsx`, `EventCountdown.tsx`, `src/lib/event/time.ts` |
| Voyage checklist tool | `src/app/tools/page.tsx`, `src/components/content/VoyageChecklist.tsx` |
| Events | `src/app/(public)/events`, `src/lib/event/*`, Supabase table `events`; authorized hosts use `/events/new` and `/events/manage` |
| Crew listings | `src/app/(public)/crew`, `src/lib/crew/*`, Supabase table `crew_listings` |
| Guides | Moderators use `/guides/new` and `/guides/[id]/edit`; markdown stored in `guides.body` |
| Gallery | Members use `/gallery/upload`; moderators approve in `/admin/gallery`; files in Supabase Storage bucket `gallery` |
| Announcements | Moderators use `/announcements/new` and `/announcements/[id]/edit`; optional cover image uploads to the public `covers` bucket |
| Policies | `src/app/privacy`, `/terms`, `/conduct`, `/security`, `/data-request` |

No fake content is seeded. `supabase/seed.sql` is intentionally empty.

### Discord event bot
A Discord *incoming webhook URL cannot read messages*. To display events, run a
bot with permission to read the chosen channels and have it POST JSON to
`/api/discord/events` with `Authorization: Bearer DISCORD_EVENTS_SECRET`:

```json
{
  "events": [{
    "external_id": "unique-message-id",
    "title": "Friday Fleet Night",
    "description": "Short description",
    "image_url": "https://cdn.discordapp.com/...",
    "starts_at": "2026-11-27T10:00:00.000Z",
    "ends_at": "2026-11-27T13:00:00.000Z"
  }]
}
```

The widget renders these events natively with images and regional times.

### Discord announcements and embeds
A bot can POST Discord messages, attachments and embeds to
`/api/discord/announcements` with `Authorization: Bearer DISCORD_EVENTS_SECRET`.
The website renders them as native cards on `/announcements` with title,
description, fields, images and a link back to the message. No external embed
script is loaded.

Channels are registered at runtime from Discord, not hard-coded. Start the feed
bot with:

```bash
npm run bot:announcements
```

Then use the `/sotafeed` slash command:

```text
/sotafeed add channel:#game-updates label:"Game updates" limit:4
/sotafeed add channel:#game-events label:"Game events" limit:4
/sotafeed limit channel:#game-updates value:6
/sotafeed remove channel:#game-events
/sotafeed list
/sotafeed enable
/sotafeed disable
```

Only members with the configured Discord Owner or Admin role can use it. The bot
polls the registered channels every 60 seconds and posts new messages into the
native feed. It needs **Message Content Intent** and permission to read the
chosen channels.

### Manual Discord role control
Website roles are assigned manually from Discord using:

```bash
npm run bot:webrole
```

The bot registers `/webrole`:

```text
/webrole set @member owner
```

Only Discord members with the configured owner role can grant `owner`; members
with the admin or owner role can grant `admin` or `member`. The server verifies
the requester's Discord roles before changing anything. No users are hard-coded.

Set:

```env
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_ADMIN_ROLE_ID=
DISCORD_OWNER_ROLE_ID=
DISCORD_COMMAND_SECRET=
```

The automatic 15-minute role sync is disabled. The old
`/api/cron/sync-discord-roles` endpoint remains available for manual bulk sync
but is not scheduled.

## Images, video and 3D assets

- Current background loops: `public/media/sot1-hero.mp4` (hero only) and
  `public/media/sot2-page.mp4` (below hero), with their posters.
- To replace them, put new files in `public/media/` and update `src/app/layout.tsx`
  and `src/components/sections/hero.tsx`.
- An unused public-domain fallback image is in `public/backgrounds/` with source
  notes in `public/backgrounds/SOURCE.md`.
- R3F scene code remains under `src/components/three/` but is **not mounted** in
  the current design. To re-enable it, render `<SceneBackground />` in the hero
  and remove the hero `<VideoLayer />`; keep DPR capped and render paused when
  hidden.
- License status of every asset is recorded in **`docs/assets.md`**. The
  owner-supplied video loops need rights confirmation before public launch.

## Owner control center

Owner-only at `/admin/control`:

- Switch sections on/off for maintenance (events, crew, guides, gallery, news, Discord event board)
- Set the Discord announcement channel URL or ID and choose how many recent posts to display
- Drag-and-drop reorder homepage sections; keyboard users can use Alt + Up / Down
- Delete content globally: announcements, events, guides, gallery items, reports and Discord announcements

Settings are stored in `public.site_settings`; every change is audit-logged.

## Deployment

1. Create a hosted Supabase project and run migrations: `npx supabase db push`
   with the hosted project linked, or apply `supabase/migrations/*.sql`.
2. Set Vercel environment variables from `.env.example`:
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only),
   `CRON_SECRET` (protects the official news sync route),
   `DISCORD_EVENTS_SECRET` (protects the Discord event receiver), and Discord OAuth variables
   once configured.
3. Deploy with `vercel --prod` or connect the Git repository. `vercel.json`
   contains the security headers and **one daily cron** (`0 3 * * *`) that calls
   `/api/cron/official-news` to refresh official news. The Hobby plan rejects
   sub-daily schedules, so the site shows the last successful sync time instead
   of implying a live feed. `/api/cron/sync-partner` remains as a manual alias
   and is no longer scheduled.
4. Register the Discord OAuth redirect URL in the Discord Developer Portal.
5. Run `npm run build` locally before deploying; verify `/api/health`.

Secrets are never exposed to the client: `src/lib/supabase/admin.ts` uses
`import "server-only"`.

## Privacy and security

- RLS on every table, server-side authorization, audit log for sensitive actions
- Zod validation and plain-text sanitisation; no `dangerouslySetInnerHTML`
- Uploads validated by MIME, size and magic bytes; stored in Supabase Storage
- CSRF Origin guard in `src/proxy.ts` (Next 16)
- Strict CSP, HSTS, nosniff, Referrer-Policy and Permissions-Policy
- No analytics, ad cookies, trackers or third-party scripts
- See `docs/security-audit.md`, `docs/local-supabase.md` and `/privacy`

## Beta testing instructions

1. `npm install && npm run dev`.
2. Visit `http://localhost:3000` and check hero, navigation, filters, empty states.
3. Test at 360px, 768px, 1440px and 1920px widths; open/close the mobile menu.
4. Scroll down and up: the hero clip fades out and the page clip fades in, then
   reverses. Progress indicator updates.
5. Check placeholder links show "Coming soon" and real links open correctly.
6. Check `/login`, `/profile`, `/settings`, `/report`, `/admin` (auth required).
7. Run `npm run build` and `npx supabase db test` before every beta release.

## Known beta limitations

- Discord OAuth credentials are not configured, so authenticated flows cannot be
  exercised end-to-end until a Discord application is created.
- Rate limiting is in-memory per process; use Postgres/Redis in multi-instance production.
- Security contact email and several social links remain `REPLACE_BEFORE_LAUNCH`.
