-- Universal media uploads, official-update admin controls, and image columns
-- used by the shared paste/drag-and-drop uploader.

-- Public media bucket for any authenticated member's pasted/dropped images
-- (event flyers, crew banners, guide covers). Uploads go through the
-- server-side /api/content/image route; policies below are defence in depth.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media_authenticated_write" on storage.objects;
create policy "media_authenticated_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

-- Image columns consumed by the universal MediaPasteUploader.
alter table public.events
  add column if not exists image_url text;
alter table public.crew_listings
  add column if not exists image_url text;
alter table public.guides
  add column if not exists image_url text;

-- Official Sea of Thieves news: provenance badge plus owner controls.
alter table public.official_updates
  add column if not exists source text not null default 'official';
alter table public.official_updates
  add column if not exists featured boolean not null default false;
alter table public.official_updates
  add column if not exists hidden boolean not null default false;

create index if not exists official_updates_featured_idx
  on public.official_updates (featured, published_at desc);
