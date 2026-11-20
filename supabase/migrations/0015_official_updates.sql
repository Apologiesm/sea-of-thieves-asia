-- Official Sea of Thieves news feed. Public read, service-role write.
create table if not exists public.official_updates (
  external_id text primary key,
  title text not null,
  url text not null,
  published_at timestamptz,
  summary text,
  image_url text,
  source_url text not null default 'https://www.seaofthieves.com/news',
  synced_at timestamptz not null default now()
);

create index if not exists official_updates_published_at_idx on public.official_updates (published_at desc);

alter table public.official_updates enable row level security;

drop policy if exists "official_updates_select" on public.official_updates;
create policy "official_updates_select" on public.official_updates
  for select to anon, authenticated using (true);

drop policy if exists "official_updates_admin_write" on public.official_updates;
create policy "official_updates_admin_write" on public.official_updates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.official_updates to anon, authenticated;
grant all on public.official_updates to service_role;
