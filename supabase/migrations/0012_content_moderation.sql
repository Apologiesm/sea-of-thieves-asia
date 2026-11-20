-- Milestone 8: guides, gallery, announcements, comments, reports and admin roles.

alter type public.user_role add value if not exists 'owner';
alter type public.content_status add value if not exists 'archived';
alter type public.report_target_type add value if not exists 'comment';

alter table public.guides
  add column if not exists tags text[] not null default '{}',
  add column if not exists reading_minutes integer not null default 1,
  add column if not exists author_name text;

alter table public.announcements
  add column if not exists category text,
  add column if not exists author_name text;

alter table public.gallery_items
  add column if not exists alt_text text;

alter table public.guides
  drop constraint if exists guide_tags_count;
alter table public.guides
  add constraint guide_tags_count check (array_length(tags, 1) <= 12);

alter table public.gallery_items
  drop constraint if exists gallery_alt_length;
alter table public.gallery_items
  add constraint gallery_alt_length check (char_length(alt_text) <= 250);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('guide', 'event')),
  target_id uuid not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments_select" on public.comments
  for select to anon, authenticated
  using (status = 'published' or public.is_moderator());

create policy "comments_insert_own" on public.comments
  for insert to authenticated
  with check (author_id = auth.uid());

create policy "comments_update_own" on public.comments
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "comments_delete_own" on public.comments
  for delete to authenticated
  using (author_id = auth.uid());

create or replace function public.is_owner_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role::text = 'owner'
  );
$$;

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
begin
  if actor is null then
    raise exception 'authentication required';
  end if;

  if not public.is_owner_role() then
    if p_role::text = 'owner' or not public.is_admin() then
      raise exception 'insufficient role to grant this role';
    end if;
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

create or replace function public.log_admin_action(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin authorization required';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.is_owner_role() from public;
grant execute on function public.is_owner_role() to authenticated;
revoke all on function public.admin_set_role(uuid, public.user_role) from public;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
revoke all on function public.log_admin_action(text, text, uuid, jsonb) from public;
grant execute on function public.log_admin_action(text, text, uuid, jsonb) to authenticated;
