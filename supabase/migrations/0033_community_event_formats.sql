-- The six community event formats the site advertises.
--
-- `pvp_tournament` and `new_captain_orientation` already existed; they are
-- kept so historical rows keep their meaning. Adding enum values is additive
-- and never rewrites existing records.

alter type public.event_type add value if not exists 'fight_nights';
alter type public.event_type add value if not exists 'last_ship_standing';
