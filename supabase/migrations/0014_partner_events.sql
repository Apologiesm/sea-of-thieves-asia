-- Partner community feed (SOTAU). Public read, admin write.
create table if not exists public.partner_events (
  external_id text primary key,
  title text not null,
  category text,
  category_label text,
  starts_at timestamptz,
  ends_at timestamptz,
  duration text,
  description text,
  image_url text,
  thumb_url text,
  badge text,
  alert text,
  link text,
  is_sotau boolean not null default false,
  source_url text not null default 'https://www.seaofthievesau.com/events',
  synced_at timestamptz not null default now()
);

create index if not exists partner_events_starts_at_idx on public.partner_events (starts_at);

alter table public.partner_events enable row level security;

drop policy if exists "partner_events_select" on public.partner_events;
create policy "partner_events_select" on public.partner_events
  for select to anon, authenticated using (true);

drop policy if exists "partner_events_admin_write" on public.partner_events;
create policy "partner_events_admin_write" on public.partner_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.partner_events to anon, authenticated;
grant all on public.partner_events to service_role;
