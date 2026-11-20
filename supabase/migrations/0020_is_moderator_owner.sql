-- Owners must also pass moderator-level checks used by admin subpages.
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin'::public.user_role)
      or public.has_role('moderator'::public.user_role)
      or public.has_role('owner'::public.user_role);
$$;

revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to anon, authenticated;
