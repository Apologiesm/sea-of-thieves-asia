# Owner setup — Sea of Thieves Asia

Everything the community owner has to configure, in the order it is worth doing.
Written for someone who has never deployed a Next.js app before. You do not need
to edit code for any step below.

If a step is skipped, the site keeps working. The related feature simply shows an
honest "not configured" state instead of pretending to be live.

---

## 1. What you need before you start

- A **Supabase** account — https://supabase.com (free tier is enough)
- A **Vercel** account — https://vercel.com (free Hobby tier is enough)
- A **GitHub** account that can push to the repository
- A **Discord** account, and permission to manage the community server
- The `.env.local` file from this project (never commit it, never share it)

The live site is deployed at https://sea-of-thieves-asia.vercel.app and reads
from the hosted Supabase project described in `AGENTS.md` §6.

---

## 2. Environment variables

Copy `.env.example` to `.env.local` for local work. On Vercel, add the same keys
under **Project → Settings → Environment Variables** for *Production* and
*Preview*.

| Variable | Needed for | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Correct canonical URLs and OAuth redirects | `https://sea-of-thieves-asia.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Every database read | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Every database read | Same page, "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | Moderation, RSVP counts, account deletion | Same page, "service_role" key — **server only** |
| `SUPABASE_DB_URL` | Running migrations | Supabase → Connect → Session pooler URI |
| `CRON_SECRET` | Scheduled jobs | Any long random string you generate |
| `DISCORD_CLIENT_ID` | Discord sign-in | Discord Developer Portal → your app → OAuth2 |
| `DISCORD_CLIENT_SECRET` | Discord sign-in | Same page (reset it if it ever leaks) |
| `DISCORD_EVENTS_SECRET` | Server-to-server event feed | Any long random string |
| `DISCORD_BOT_TOKEN` | Optional bot helpers | Discord Developer Portal → Bot |
| `DISCORD_GUILD_ID` | Optional bot helpers | Discord server → right-click → Copy Server ID |
| `DISCORD_ADMIN_ROLE_ID` | Optional role sync | Discord server roles |
| `DISCORD_OWNER_ROLE_ID` | Optional owner role sync | Discord server roles |
| `DISCORD_COMMAND_SECRET` | Manual role command endpoint | Any long random string |
| `BOOTSTRAP_ADMIN_DISCORD_IDS` | First admin on first sign-in | Your Discord user ID |

**Rules**

1. `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` and every `DISCORD_*SECRET` are
   server secrets. They must never appear in `NEXT_PUBLIC_*` variables.
2. After changing variables on Vercel, redeploy — running deployments keep the
   values they started with.
3. The site fails closed when a secret is missing. A missing Discord secret
   disables Discord features; it does not open them up.

---

## 3. Supabase

1. Create a project. Pick the region closest to your players —
   **Southeast Asia (Singapore)** for this community.
2. Open **SQL Editor** and confirm the migrations in `supabase/migrations/` have
   been applied. From this repository:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

3. Copy the project URL, anon key and service-role key into your environment
   variables (step 2).
4. Under **Authentication → URL Configuration**:
   - Site URL: `https://sea-of-thieves-asia.vercel.app`
   - Redirect URLs: add `https://sea-of-thieves-asia.vercel.app/**` and
     `http://localhost:3000/**`
5. Storage buckets are created by the migrations. Do not create them by hand.
   `avatars` and `gallery` are private; `covers` and `media` are public.

---

## 4. Discord sign-in (required for accounts)

1. Go to https://discord.com/developers/applications → **New Application**.
2. **OAuth2 → General**:
   - Copy the Client ID and Client Secret into `DISCORD_CLIENT_ID` and
     `DISCORD_CLIENT_SECRET`.
   - Add this exact redirect URL:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In Supabase: **Authentication → Providers → Discord** → enable it, paste the
   same Client ID and Secret.
4. Test it: open the site, choose **Sign in**, approve the Discord prompt. You
   should land back on the site signed in.

If the redirect URL is missing, Discord shows `redirect_uri` errors and sign-in
cannot complete. That is the single most common setup mistake.

---

## 5. Discord bot (optional)

The website works without a bot. A bot only adds role sync and channel feeds.

1. Same Discord application → **Bot** → **Add Bot** → copy the token into
   `DISCORD_BOT_TOKEN`.
2. Enable **Server Members Intent** if you want role sync.
3. Invite it with the `bot` and `applications.commands` scopes, and give it
   *Manage Roles* (role sync), *Send Messages* and *Embed Links* (feeds).
4. Put the bot role **above** the member role it manages, otherwise Discord
   refuses the role change.

A Discord **incoming webhook** can only post messages into Discord. It cannot
read messages, members or events. Anything that needs reading uses the bot
token or the Supabase-backed feed endpoints.

---

## 6. Scheduled jobs (Vercel)

`vercel.json` defines **one** cron (the Hobby plan rejects anything more
frequent than daily):

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/official-news` | 03:00 UTC daily | Official Sea of Thieves news, images and video metadata |

It accepts `Authorization: Bearer $CRON_SECRET`, which Vercel sends
automatically when the environment variable exists. Admins can also run it
from `/admin/master`, and `POST /api/sync/official-sot` remains available for a
manual run. `/api/cron/sync-partner` is now only a manual alias — it is no
longer scheduled, so the same job never runs twice.

To test manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://sea-of-thieves-asia.vercel.app/api/cron/official-news
```

Every run writes to the `sync_state` table: last attempt, last success, records
processed, records changed and the last error. The news section on the homepage
and `/admin/master` show that freshness, so the site never claims to be live
when it is refreshed once a day. If the upstream page changes shape, the run
fails loudly in `sync_state` and the previously stored articles stay visible.

---

## 6b. Display time zones

UTC is the default for every visitor; the browser's own zone is never applied
silently. Visitors pick a zone in the Regional Time panel on the homepage. The
choice is stored in the `sot_tz` cookie and `localStorage` for anonymous
visitors, and saved to `profiles.timezone` (endpoint
`POST /api/profile/timezone`) once signed in, so it follows them to another
device.

Event hosts enter times in any of the same 14 zones; the value is converted to
UTC before saving, and `events.timezone` keeps the original zone for reference.

---

## 7. First administrator

1. Sign in once with Discord. This creates your `profiles` row.
2. In Supabase → SQL Editor:

   ```sql
   select id, display_name from public.profiles;
   insert into public.user_roles (user_id, role)
   values ('<your-profile-uuid>', 'owner')
   on conflict do nothing;
   ```

3. Reload the site. `/admin` and `/admin/master` become available. `owner`
   implies every other permission, and the role cannot be removed by another
   admin.

Optionally set `BOOTSTRAP_ADMIN_DISCORD_IDS` to your Discord user ID so future
first-time sign-ins bootstrap as admin.

---

## 8. Content the owner must supply

These cannot be invented by the code and are the only remaining content gaps:

- **Contact email** — `SECURITY_CONTACT_EMAIL` in `src/lib/content/site-config.ts`.
  Until set, the security and data-request pages explain that no address is
  published and point people to Discord.
- **Social links** — `SOCIAL_LINKS` in the same file. Entries left as
  `PLACEHOLDER` are hidden from the footer rather than shown as dead links.
  Currently live: Discord invite, Instagram, Facebook.
- **Community policies** — `/conduct`, `/privacy`, `/terms` are written and live;
  read them once and edit anything that does not match how you actually run the
  server.

---

## 9. Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which type-checks,
builds and deploys to Vercel. Requirements:

- Repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` are set.
- The commit author must be the Vercel team member account, otherwise Vercel
  rejects the deployment with `TEAM_ACCESS_REQUIRED`.

Manual deploy, if ever needed:

```bash
npx vercel --prod
```

---

## 10. Health check

```bash
curl https://sea-of-thieves-asia.vercel.app/api/health
```

Expected:

```json
{ "status": "ok", "database": "supabase", "rls": "enforced" }
```

If `database` is `"unconfigured"`, the Supabase environment variables are
missing on that deployment. Public pages still render with honest empty states
rather than crashing.
