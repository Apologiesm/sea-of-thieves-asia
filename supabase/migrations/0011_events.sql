-- Milestone 7: events, hosts, timezone data and RSVP guards.

create type public.event_type as enum (
  'fleet_night',
  'pvp_tournament',
  'treasure_hunt',
  'new_captain_orientation',
  'stream_night',
  'community_challenge'
);

alter type public.content_status add value if not exists 'cancelled';
alter type public.content_status add value if not exists 'completed';

alter table public.events
  add column if not exists event_type public.event_type,
  add column if not exists region text,
  add column if not exists platform text,
  add column if not exists timezone text not null default 'Asia/Singapore',
  add column if not exists discord_event_url text,
  add column if not exists max_attendees integer;

alter table public.events
  drop constraint if exists event_region_length;
alter table public.events
  add constraint event_region_length check (char_length(region) <= 80);

alter table public.events
  drop constraint if exists event_platform_length;
alter table public.events
  add constraint event_platform_length check (char_length(platform) <= 80);

alter table public.events
  drop constraint if exists event_max_attendees_check;
alter table public.events
  add constraint event_max_attendees_check check (max_attendees is null or max_attendees between 1 and 500);

create table if not exists public.event_hosts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table public.event_hosts enable row level security;

create policy "event_hosts_select" on public.event_hosts
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_moderator()
  );

create or replace function public.is_event_host()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or public.is_moderator()
      or exists (
        select 1 from public.event_hosts
        where user_id = auth.uid()
      );
$$;

revoke all on function public.is_event_host() from public;
grant execute on function public.is_event_host() to anon, authenticated;

-- Only server-side role checks may create or edit events.
drop policy if exists "events_insert_mod" on public.events;
drop policy if exists "events_update_mod" on public.events;

create policy "events_insert_authorized" on public.events
  for insert to authenticated
  with check (public.is_event_host());

create policy "events_update_authorized" on public.events
  for update to authenticated
  using (public.is_event_host() or created_by = auth.uid())
  with check (public.is_event_host() or created_by = auth.uid());

create index if not exists events_status_starts_at_idx
  on public.events (status, starts_at desc);

-- RSVPs require a published event and an authenticated owner.
create or replace function public.guard_rsvp()
returns trigger
language plpgsql
as $$
begin
  if new.user_id <> auth.uid() then
    raise exception 'rsvp must belong to the signed-in member';
  end if;

  if not exists (
    select 1 from public.events e
    where e.id = new.event_id and e.status = 'published'
  ) then
    raise exception 'rsvp is only available for published events';
  end if;

  return new;
end;
$$;

drop trigger if exists event_rsvps_guard on public.event_rsvps;
create trigger event_rsvps_guard
  before insert or update on public.event_rsvps
  for each row execute function public.guard_rsvp();
