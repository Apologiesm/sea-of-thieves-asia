# Sea of Thieves Asia — Milestone 1

Beta foundation for an unofficial Sea of Thieves Asia fan-community site.
Built with Next.js App Router, TypeScript, Tailwind CSS, and a local Supabase
schema with Row Level Security.

> This is an unofficial fan community and is not affiliated with, endorsed by,
> or connected to Rare, Xbox, or Sea of Thieves.

## Beta content contract

All community data is placeholder-only. See `AGENTS.md` and `docs/`.

- `DISCORD_INVITE_URL` and all social links: `REPLACE_BEFORE_LAUNCH`
- `EVENTS`, `GALLERY`, `GUIDES`, `ANNOUNCEMENTS`, `CREW_LISTINGS`: `EMPTY_FOR_BETA`
- No invented members, events, statistics, testimonials, sponsors, or links.
- Placeholder links render as non-clickable "Coming soon" labels.

## Requirements

- Node.js 22.19+ / 24.11+ / 26+ and npm
- Docker for local Supabase (`supabase start`) — optional for the UI itself

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
npm run typecheck # TypeScript (no emit)
```

## Environment

```bash
cp .env.example .env.local
```

Fill in values printed by `supabase start`. `.env.local` is gitignored.
Never commit keys or put them in frontend code.

## Local Supabase

```bash
supabase start
supabase db reset
```

The seed file is intentionally empty. No sample content is generated.

## Structure

- `src/app` — App Router pages and route segments
- `src/components` — reusable UI, layout, and content components
- `src/lib` — environment, content config, Supabase clients, utilities
- `src/types` — shared types
- `supabase/migrations` — schema, functions, RLS, storage
- `docs` — brand, content, and asset rules

## Disclaimer

Sea of Thieves Asia is an unofficial fan community and is not affiliated with,
endorsed by, or connected to Rare, Xbox, or Sea of Thieves.
