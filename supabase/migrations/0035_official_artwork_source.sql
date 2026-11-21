-- Where each official event's artwork came from.
--
-- The Event Hub keeps its card images in JSON, not markup, so the synchroniser
-- now reads them and copies the file into the public `covers` bucket. That
-- leaves two different values worth telling apart: the URL we serve visitors
-- (`artwork_url`, now a Supabase Storage URL) and the official file it was
-- copied from (`artwork_source`). Keeping the source means a changed official
-- image is detected and re-copied instead of being cached forever.
--
-- Additive only.

alter table public.official_events
  add column if not exists artwork_source text;

comment on column public.official_events.artwork_source is
  'Official CDN URL the artwork was copied from; null when artwork_url was never mirrored.';
