-- Official Sea of Thieves events, kept separate from community submissions.
--
-- The Event Hub publishes both dated events ("25th November 2026 (10:00 AM) -
-- 2nd December 2026 (10:00 AM)") and recurring rules ("Weekly (from Tuesday
-- 10am UTC)", "Twice Daily: 1am - 2am and 5pm - 6pm UTC"). Dates live in
-- timestamptz columns; recurring rules live in jsonb so a new weekly event
-- never needs a database enum change. Additive only, nothing existing touched.

create table if not exists public.official_events (
  id uuid primary key default gen_random_uuid(),
  -- Stable dedupe key derived from the official name and schedule, so a second
  -- synchronisation updates the same row instead of inserting a duplicate.
  external_id text not null unique,
  name text not null,
  category text,
  -- CMS status wording, e.g. "Coming Soon" or "Live Now".
  flag text,
  description text,
  source_url text,
  artwork_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  -- The official date line exactly as published, e.g. "Weekly (from Tuesday
  -- 10am UTC)". Kept verbatim so a visitor can always be shown the source words.
  schedule_note text,
  -- { kind: "weekly" | "daily" | "unscheduled", weekday, startTime, times,
  --   durationMinutes }
  recurrence jsonb,
  -- "headline" events are the ones the Event Hub presents as events. "ambient"
  -- covers recurring in-game bonuses such as Gold Rush windows.
  tier text not null default 'headline' check (tier in ('headline', 'ambient')),
  -- Only "verified" rows come from a successful read of an official source.
  status text not null default 'verified' check (status in ('verified', 'unverified', 'cancelled')),
  featured_ship text,
  verified_at timestamptz,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists official_events_starts_at_idx on public.official_events (starts_at);
create index if not exists official_events_tier_idx on public.official_events (tier, status);

comment on table public.official_events is
  'Events published by the official Sea of Thieves Event Hub. Never mixed with community events.';
comment on column public.official_events.recurrence is
  'Recurring rule for weekly/daily events. Dated events leave this null and use starts_at/ends_at.';
comment on column public.official_events.schedule_note is
  'The official date wording, verbatim, used for display and re-parsing.';

-- Explicit per-occurrence exceptions (skips, cancellations) for recurring rules.
create table if not exists public.official_event_exceptions (
  id uuid primary key default gen_random_uuid(),
  event_external_id text not null references public.official_events (external_id) on delete cascade,
  occurs_on date not null,
  kind text not null default 'skip' check (kind in ('skip', 'cancelled')),
  reason text,
  created_at timestamptz not null default now(),
  unique (event_external_id, occurs_on)
);

comment on table public.official_event_exceptions is
  'Marks a single occurrence of a recurring official event as skipped or cancelled.';

alter table public.official_events enable row level security;
alter table public.official_event_exceptions enable row level security;

drop policy if exists "official_events_public_read" on public.official_events;
create policy "official_events_public_read" on public.official_events
  for select to anon, authenticated using (true);

drop policy if exists "official_events_admin_write" on public.official_events;
create policy "official_events_admin_write" on public.official_events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "official_event_exceptions_public_read" on public.official_event_exceptions;
create policy "official_event_exceptions_public_read" on public.official_event_exceptions
  for select to anon, authenticated using (true);

drop policy if exists "official_event_exceptions_admin_write" on public.official_event_exceptions;
create policy "official_event_exceptions_admin_write" on public.official_event_exceptions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.official_events to anon, authenticated;
grant select on public.official_event_exceptions to anon, authenticated;
grant all on public.official_events to service_role;
grant all on public.official_event_exceptions to service_role;

-- Live updates: a rescheduled official event should refresh an open page.
do $$
begin
  begin
    alter publication supabase_realtime add table public.official_events;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
