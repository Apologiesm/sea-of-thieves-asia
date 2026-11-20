-- Milestone 5: profile fields, minimal data, and hardened privacy.

alter table public.profiles
  add column if not exists region text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists platform text,
  add column if not exists playstyle text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists crew_name text,
  add column if not exists crew_role text;

alter table public.profiles
  drop constraint if exists region_length;
alter table public.profiles
  add constraint region_length check (char_length(region) <= 80);

alter table public.profiles
  drop constraint if exists platform_length;
alter table public.profiles
  add constraint platform_length check (char_length(platform) <= 80);

alter table public.profiles
  drop constraint if exists playstyle_length;
alter table public.profiles
  add constraint playstyle_length check (char_length(playstyle) <= 80);

alter table public.profiles
  drop constraint if exists languages_count;
alter table public.profiles
  add constraint languages_count check (array_length(languages, 1) <= 12);

-- Discord identity is immutable after account creation.
create or replace function public.guard_profile_identity()
returns trigger
language plpgsql
as $$
begin
  if new.discord_id is distinct from old.discord_id
     and current_user not in ('postgres', 'service_role') then
    raise exception 'discord identity cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_identity on public.profiles;
create trigger profiles_guard_identity
  before update on public.profiles
  for each row execute function public.guard_profile_identity();

-- Direct table reads are private. Public discovery uses the view below.
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "member_select_visible_profiles" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Public-facing projection. Only fields the member chose to expose.
create or replace view public.public_profiles
with (security_barrier = true) as
select
  p.id,
  p.display_name,
  p.avatar_url,
  p.region,
  p.languages,
  p.platform,
  p.playstyle,
  p.bio,
  p.social_links,
  p.crew_name,
  p.crew_role
from public.profiles p
where p.visibility = 'public'
   or (p.visibility = 'members' and auth.role() = 'authenticated')
   or p.id = auth.uid()
   or public.is_admin();

alter view public.public_profiles owner to postgres;
grant select on public.public_profiles to anon, authenticated;

comment on view public.public_profiles is
  'Privacy-filtered projection of profiles. Never exposes email, Discord identity, or private fields.';

-- The service-role key is never available to the browser; deletion is done
-- through a server-only route that calls the Supabase admin API.
comment on function public.delete_my_account() is
  'Removes the caller''s profile and related rows. Auth user removal is performed server-side.';
