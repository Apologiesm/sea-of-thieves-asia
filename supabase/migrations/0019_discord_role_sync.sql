-- Map Discord roles to website roles without hard-coding users.
create or replace function public.sync_discord_member_role(
  p_discord_id text,
  p_role public.user_role
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_current public.user_role[];
  v_owner_count integer;
begin
  select id into v_profile_id
  from public.profiles
  where discord_id = p_discord_id
  limit 1;

  if v_profile_id is null then
    return 'profile_not_found';
  end if;

  select array_agg(role) into v_current
  from public.user_roles
  where user_id = v_profile_id;

  -- Never remove the last owner through an automated sync.
  if coalesce(array_position(v_current, 'owner'::public.user_role), 0) > 0
     and p_role <> 'owner'::public.user_role then
    select count(*) into v_owner_count
    from public.user_roles
    where role = 'owner'::public.user_role;

    if v_owner_count <= 1 then
      return 'last_owner_kept';
    end if;
  end if;

  delete from public.user_roles
  where user_id = v_profile_id
    and role <> 'member'::public.user_role;

  if p_role <> 'member'::public.user_role then
    insert into public.user_roles (user_id, role, granted_by)
    values (v_profile_id, p_role, null)
    on conflict (user_id, role) do nothing;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    null,
    'discord_role_sync',
    'profile',
    v_profile_id,
    jsonb_build_object('role', p_role, 'source', 'discord')
  );

  return 'ok';
end;
$$;

revoke all on function public.sync_discord_member_role(text, public.user_role) from public;
grant execute on function public.sync_discord_member_role(text, public.user_role) to service_role;
