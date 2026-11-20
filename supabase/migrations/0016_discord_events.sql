-- Remove partner feed; add Discord bot event board.
drop table if exists public.partner_events;

create table if not exists public.discord_events (
  external_id text primary key,
  title text not null,
  description text,
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  event_url text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discord_events_starts_at_idx on public.discord_events (starts_at);

alter table public.discord_events enable row level security;

drop policy if exists "discord_events_select" on public.discord_events;
create policy "discord_events_select" on public.discord_events
  for select to anon, authenticated using (true);

drop policy if exists "discord_events_admin_write" on public.discord_events;
create policy "discord_events_admin_write" on public.discord_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.discord_events to anon, authenticated;
grant all on public.discord_events to service_role;
