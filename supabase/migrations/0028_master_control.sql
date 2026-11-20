-- Master control: universal owner/admin override, layout engine, ordering,
-- pinning, and owner-account protection.
--
-- Apply with `npx supabase migration up` locally, or paste this file into the
-- Supabase SQL Editor on a hosted project.

-- ---------------------------------------------------------------------------
-- 1. Role helpers
-- ---------------------------------------------------------------------------

-- True when the given profile holds the owner role.
create or replace function public.is_owner_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = 'owner'::public.user_role
  );
$$;

revoke all on function public.is_owner_user(uuid) from public;
grant execute on function public.is_owner_user(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Ordering / visibility / pinning columns on every content table
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'events', 'guides', 'announcements', 'gallery_items', 'crew_listings', 'comments'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists sort_order integer not null default 0', t
    );
    execute format(
      'alter table public.%I add column if not exists is_enabled boolean not null default true', t
    );
    execute format(
      'alter table public.%I add column if not exists is_featured boolean not null default false', t
    );
    execute format(
      'create index if not exists %I on public.%I (is_enabled, sort_order asc, created_at desc)',
      t || '_order_idx', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Layout engine + kill switches
-- ---------------------------------------------------------------------------

create table if not exists public.site_layout_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_layout_config enable row level security;

drop policy if exists "site_layout_config_select" on public.site_layout_config;
create policy "site_layout_config_select" on public.site_layout_config
  for select to anon, authenticated using (true);

drop policy if exists "site_layout_config_admin_write" on public.site_layout_config;
create policy "site_layout_config_admin_write" on public.site_layout_config
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.site_layout_config to anon, authenticated;
grant all on public.site_layout_config to service_role;

insert into public.site_layout_config (key, value)
values
  (
    'home_sections',
    '{"order":["live","news","discord","about","features","previews","join"],"hidden":[]}'::jsonb
  ),
  (
    'kill_switches',
    '{"maintenanceMode":false,"crewSubmissions":true,"galleryUploads":true,"officialSync":true,"discordAutoPost":true}'::jsonb
  ),
  (
    'nav_order',
    '{"order":["/events","/crew","/gallery","/guides","/announcements"]}'::jsonb
  )
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Universal owner/admin override policies
--    Permissive policies are OR-ed, so these widen access without removing
--    the existing owner-scoped member policies.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'events', 'event_rsvps', 'event_hosts',
    'guides', 'announcements', 'gallery_items', 'comments',
    'crew_listings', 'crew_applications',
    'reports', 'moderation_actions', 'audit_log',
    'official_updates', 'discord_events', 'discord_announcements',
    'profiles', 'user_consents', 'user_roles'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_master_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_master_admin_all', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Owner-account protection in role assignment
--    - admin may only assign member/moderator/admin
--    - admin may NEVER change an existing owner's role
--    - only an owner may grant or revoke the owner role
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_role(
  p_user_id uuid,
  p_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  target_is_owner boolean;
begin
  if actor is null then
    raise exception 'authentication required';
  end if;

  select public.is_owner_user(p_user_id) into target_is_owner;

  if not public.is_owner_role() then
    -- Admins cannot touch owner accounts at all.
    if target_is_owner then
      raise exception 'cannot modify an owner account';
    end if;
    -- Admins cannot grant the owner role.
    if p_role::text = 'owner' then
      raise exception 'insufficient role to grant this role';
    end if;
    if not public.is_admin() then
      raise exception 'insufficient role to grant this role';
    end if;
  end if;

  -- Never allow the last owner to be removed by themselves accidentally.
  if target_is_owner
     and p_role <> 'owner'::public.user_role
     and (select count(*) from public.user_roles where role = 'owner'::public.user_role) <= 1 then
    raise exception 'cannot remove the last owner';
  end if;

  delete from public.user_roles
  where user_id = p_user_id and role <> 'member'::public.user_role;

  if p_role <> 'member'::public.user_role then
    insert into public.user_roles (user_id, role, granted_by)
    values (p_user_id, p_role, actor);
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (actor, 'role_changed', 'profile', p_user_id, jsonb_build_object('role', p_role));
end;
$$;

revoke all on function public.admin_set_role(uuid, public.user_role) from public;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
