-- Milestone 6: crew finder fields, owner-only edits, server-side moderation.

alter type public.crew_status add value if not exists 'hidden';
alter type public.crew_status add value if not exists 'removed';

alter table public.crew_listings
  add column if not exists languages text[] not null default '{}',
  add column if not exists platform text,
  add column if not exists playstyle text,
  add column if not exists ship_preference text,
  add column if not exists role_preference text,
  add column if not exists availability text,
  add column if not exists contact_consent boolean not null default false,
  add column if not exists contact_method text;

alter table public.crew_listings
  drop constraint if exists crew_languages_count;
alter table public.crew_listings
  add constraint crew_languages_count check (array_length(languages, 1) <= 12);

alter table public.crew_listings
  drop constraint if exists crew_platform_length;
alter table public.crew_listings
  add constraint crew_platform_length check (char_length(platform) <= 80);

alter table public.crew_listings
  drop constraint if exists crew_playstyle_length;
alter table public.crew_listings
  add constraint crew_playstyle_length check (char_length(playstyle) <= 80);

alter table public.crew_listings
  drop constraint if exists crew_ship_pref_length;
alter table public.crew_listings
  add constraint crew_ship_pref_length check (char_length(ship_preference) <= 80);

alter table public.crew_listings
  drop constraint if exists crew_role_pref_length;
alter table public.crew_listings
  add constraint crew_role_pref_length check (char_length(role_preference) <= 80);

alter table public.crew_listings
  drop constraint if exists crew_availability_length;
alter table public.crew_listings
  add constraint crew_availability_length check (char_length(availability) <= 80);

alter table public.crew_listings
  drop constraint if exists crew_contact_consent_check;
alter table public.crew_listings
  add constraint crew_contact_consent_check
  check (contact_consent or contact_method is null);

-- Only the author may edit a listing through the API. Moderators use the
-- SECURITY DEFINER function below; they get no direct UPDATE policy.
drop policy if exists "crew_listings_update" on public.crew_listings;
create policy "crew_listings_owner_update" on public.crew_listings
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "crew_listings_delete" on public.crew_listings;
create policy "crew_listings_owner_delete" on public.crew_listings
  for delete to authenticated
  using (author_id = auth.uid());

create or replace function public.moderate_crew_listing(
  p_listing_id uuid,
  p_status public.crew_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderator authorization required';
  end if;

  update public.crew_listings
  set status = p_status,
      updated_at = now()
  where id = p_listing_id;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'crew_listing_moderated',
    'crew_listing',
    p_listing_id,
    jsonb_build_object('status', p_status, 'note', coalesce(p_note, ''))
  );
end;
$$;

revoke all on function public.moderate_crew_listing(uuid, public.crew_status, text) from public;
grant execute on function public.moderate_crew_listing(uuid, public.crew_status, text) to authenticated;

comment on function public.moderate_crew_listing(uuid, public.crew_status, text) is
  'Server-side moderator action. Never exposed to client-side authorization.';
