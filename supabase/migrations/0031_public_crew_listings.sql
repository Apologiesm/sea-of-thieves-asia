-- Public crew discovery.
--
-- Until now `crew_listings` was readable only by signed-in members, so visitors
-- saw an empty crew finder and an empty homepage preview. Browsing open crews
-- should work for everyone; contact details must not.
--
-- This view exposes the public shape of an open listing and omits
-- `contact_method` / `contact_consent` entirely. Signed-in members still read
-- the table directly when the contact field matters.

create or replace view public.public_crew_listings
with (security_barrier = true) as
select
  l.id,
  l.author_id,
  l.title,
  l.description,
  l.region,
  l.platform,
  l.languages,
  l.playstyle,
  l.ship_preference,
  l.role_preference,
  l.availability,
  l.seats_total,
  l.seats_filled,
  l.status,
  l.image_url,
  l.expires_at,
  l.created_at,
  l.updated_at,
  l.is_enabled,
  l.is_featured,
  l.sort_order
from public.crew_listings l
where l.status = 'open'
  and l.is_enabled = true
  and (l.expires_at is null or l.expires_at > now());

revoke all on public.public_crew_listings from anon, authenticated;
grant select on public.public_crew_listings to anon, authenticated;

comment on view public.public_crew_listings is
  'Public projection of open crew listings. Contact fields are intentionally excluded.';

-- Detail pages for anonymous visitors must read the same projection, so the
-- existing row-level policy stays untouched for the table itself.
drop policy if exists "crew_listings_select_anon" on public.crew_listings;
