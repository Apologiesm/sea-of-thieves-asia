-- Realtime delivery for public community content, richer official news media,
-- and an observable record of every synchronisation run.
-- Additive only.

-- 1. Realtime -----------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array['events', 'announcements', 'crew_listings', 'gallery_items', 'guides'];
begin
  foreach t in array tables loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;  -- already published
      when undefined_object then null;  -- publication missing (plain Postgres)
    end;
  end loop;
end $$;

-- 2. Official news media -------------------------------------------------------
alter table public.official_updates
  add column if not exists video_url text;
alter table public.official_updates
  add column if not exists video_thumbnail_url text;
alter table public.official_updates
  add column if not exists image_source text;
alter table public.official_updates
  add column if not exists verified_at timestamptz;

comment on column public.official_updates.video_url is
  'Official video URL referenced by the article (YouTube or seaofthieves.com).';
comment on column public.official_updates.image_source is
  'Where the stored image came from: og:image, article-html, rss-media, or none.';

-- 3. Synchronisation health ----------------------------------------------------
create table if not exists public.sync_state (
  source text primary key,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  records_processed integer not null default 0,
  records_changed integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.sync_state enable row level security;

drop policy if exists "sync_state_admin_read" on public.sync_state;
create policy "sync_state_admin_read" on public.sync_state
  for select to authenticated
  using (public.is_admin());

grant select on public.sync_state to authenticated;
grant all on public.sync_state to service_role;

comment on table public.sync_state is
  'One row per external source. Written by server-side sync jobs, read by admins.';
