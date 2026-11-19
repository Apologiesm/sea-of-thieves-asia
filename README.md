# Sea of Thieves Asia — Milestone 3

Local Supabase development setup. The app connects only to the local stack;
production is not configured.

> Unofficial fan community. Not affiliated with Rare, Xbox, or Sea of Thieves.

## Prerequisites

- Node.js 22.19+ / 24.11+ / 26+ and npm
- A running Docker daemon (Docker Desktop, or the native daemon in WSL)

Supabase CLI and the Supabase JS client are **project dependencies** installed
by `npm install`. Nothing needs a global install.

## Start local Supabase (first time)

```bash
cd ~/projects/sea-of-thieves-asia
npm install
npx supabase init          # already initialised; safe to re-run
npx supabase start         # pulls images on first run, applies migrations
```

`supabase start` prints local URLs and keys. Copy the anon key into `.env.local`:

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_SUPABASE_ANON_KEY from `npx supabase status`
```

Then run the app:

```bash
npm run dev                # http://localhost:3000
npm run build
npm run typecheck
npm run lint
```

Local endpoints (printed by `npx supabase status`):

- Studio: http://127.0.0.1:54323
- API: http://127.0.0.1:54321
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Verify the app's connection:

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","database":"local","rls":"enforced"}`.

## Stop and reset

```bash
npx supabase stop          # stop containers, keep data
npx supabase stop --no-backup  # stop and discard local data
npx supabase db reset      # reapply all migrations, empty seed
```

## Database

Migrations live in `supabase/migrations/`. Every table has RLS enabled.
Roles: `member` (default), `moderator`, `admin`, and `owner` (resource owner).
The service-role key is server-only and is never imported by client code.

`supabase/seed.sql` is intentionally empty — no invented community content.

See [docs/local-supabase.md](docs/local-supabase.md) for details.
