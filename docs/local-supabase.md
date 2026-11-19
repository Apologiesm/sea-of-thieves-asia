# Local Supabase development

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Installs the Supabase CLI and JS client as project dependencies |
| `npx supabase init` | Initialises/validates `supabase/config.toml` |
| `npx supabase start` | Starts the local Docker stack and applies migrations |
| `npx supabase status` | Prints local URLs, keys, and the database connection string |
| `npx supabase stop` | Stops containers, keeping the local volume |
| `npx supabase stop --no-backup` | Stops and discards local data |
| `npx supabase db reset` | Drops local data and reapplies all migrations + empty seed |
| `npx supabase db test` | Runs pgTAP RLS tests in `supabase/tests/` |
| `npm run dev` | Next.js dev server on port 3000 |
| `npm run build` | Production build |

## Local services

After `npx supabase start` (also shown by `npx supabase status`):

- Supabase Studio: http://127.0.0.1:54323
- Supabase API: http://127.0.0.1:54321
- Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Inbucket (mail preview): http://127.0.0.1:54324

## Environment

Copy `.env.example` to `.env.local` and set only local values. `.env.local`
is gitignored. The anon key is public by design; the service-role key must
stay in server-side code and is never imported by a Client Component.

## Schema and security

- All tables are created in `supabase/migrations/0002`–`0006`.
- RLS is enabled on every table in `0004`.
- Role helpers (`has_role`, `is_admin`, `is_moderator`, `is_owner`) and explicit
  member/moderator/admin/owner policies are in `0002` and `0007`.
- `supabase/seed.sql` is empty. No sample members, events, or content.

## Production

Not configured. Do not point local development at a hosted project.
