-- Cover images and native Discord announcement/embed feed.
alter table public.announcements
  add column if not exists cover_image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers', 'covers', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'covers');

drop policy if exists "covers_admin_write" on storage.objects;
create policy "covers_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());

create table if not exists public.discord_announcements (
  external_id text primary key,
  channel_id text not null,
  author_name text,
  content text,
  posted_at timestamptz,
  image_url text,
  embeds jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  message_url text,
  synced_at timestamptz not null default now()
);

create index if not exists discord_announcements_posted_at_idx
  on public.discord_announcements (posted_at desc);

alter table public.discord_announcements enable row level security;

drop policy if exists "discord_announcements_select" on public.discord_announcements;
create policy "discord_announcements_select" on public.discord_announcements
  for select to anon, authenticated using (true);

drop policy if exists "discord_announcements_admin_write" on public.discord_announcements;
create policy "discord_announcements_admin_write" on public.discord_announcements
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.discord_announcements to anon, authenticated;
grant all on public.discord_announcements to service_role;
