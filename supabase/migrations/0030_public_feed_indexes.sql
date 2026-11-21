-- Indexes for the queries the public pages actually run.
-- Additive only: no data changes, no policy changes.

-- Public crew listings: newest open listing that has not expired.
create index if not exists crew_listings_public_feed_idx
  on public.crew_listings (created_at desc)
  where status = 'open' and is_enabled = true;

create index if not exists crew_listings_expiry_idx
  on public.crew_listings (expires_at)
  where status = 'open';

-- Public event lists: soonest upcoming and most recent past voyages.
create index if not exists events_public_upcoming_idx
  on public.events (starts_at)
  where status = 'published' and is_enabled = true;

-- Guides and gallery feeds.
create index if not exists guides_published_feed_idx
  on public.guides (updated_at desc)
  where status = 'published' and is_enabled = true;

create index if not exists gallery_items_approved_feed_idx
  on public.gallery_items (created_at desc)
  where status = 'approved' and is_enabled = true;
