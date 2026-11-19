-- Content tables. No seed data: every table starts empty.

create type public.content_status as enum ('draft', 'published');
create type public.rsvp_status as enum ('going', 'maybe', 'cant_go');
create type public.gallery_status as enum ('pending', 'approved', 'rejected');
create type public.crew_status as enum ('open', 'closed');
create type public.application_status as enum ('pending', 'accepted', 'rejected');
create type public.report_target_type as enum (
  'profile', 'event', 'guide', 'gallery_item', 'crew_listing', 'announcement'
);
create type public.report_status as enum ('open', 'in_review', 'resolved', 'dismissed');
create type public.moderation_action as enum ('approve', 'reject', 'remove', 'warn');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  status public.content_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.rsvp_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  category text,
  author_id uuid references public.profiles (id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text,
  author_id uuid references public.profiles (id) on delete set null,
  pinned boolean not null default false,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  caption text,
  status public.gallery_status not null default 'pending',
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crew_listings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  game_mode text,
  region text,
  seats_total integer not null default 1 check (seats_total between 1 and 20),
  seats_filled integer not null default 0 check (seats_filled >= 0),
  status public.crew_status not null default 'open',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seats_filled_within_total check (seats_filled <= seats_total)
);

create table public.crew_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.crew_listings (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete cascade,
  moderator_id uuid references public.profiles (id) on delete set null,
  action public.moderation_action not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_consents (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  policy_version text not null,
  accepted_at timestamptz not null default now()
);

create index events_status_idx on public.events (status);
create index guides_status_idx on public.guides (status);
create index announcements_status_idx on public.announcements (status);
create index gallery_items_status_idx on public.gallery_items (status);
create index crew_listings_status_idx on public.crew_listings (status);
create index reports_status_idx on public.reports (status);
create index audit_log_created_at_idx on public.audit_log (created_at desc);
