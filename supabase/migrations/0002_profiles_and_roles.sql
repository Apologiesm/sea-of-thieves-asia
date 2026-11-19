-- Profile and role model. All role checks are server-side.

create type public.user_role as enum ('admin', 'moderator', 'member');
create type public.profile_visibility as enum ('public', 'members', 'private');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  discord_id text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  timezone text,
  visibility public.profile_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint display_name_length check (char_length(display_name) <= 64),
  constraint bio_length check (char_length(bio) <= 500)
);

comment on table public.profiles is
  'Public-facing member profile. Discord email and message data are never stored.';

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role);

-- Helper functions used by RLS. SECURITY DEFINER with a pinned search path.
create or replace function public.has_role(p_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = p_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin'::public.user_role);
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin'::public.user_role)
      or public.has_role('moderator'::public.user_role);
$$;

revoke all on function public.has_role(public.user_role) from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_moderator() from public;
grant execute on function public.has_role(public.user_role) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_moderator() to anon, authenticated;
