-- Triggers and server-side functions. No client-side authorization.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, discord_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'provider_id', ''), new.id::text),
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'member'::public.user_role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger event_rsvps_set_updated_at before update on public.event_rsvps
  for each row execute function public.set_updated_at();
create trigger guides_set_updated_at before update on public.guides
  for each row execute function public.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();
create trigger gallery_items_set_updated_at before update on public.gallery_items
  for each row execute function public.set_updated_at();
create trigger crew_listings_set_updated_at before update on public.crew_listings
  for each row execute function public.set_updated_at();
create trigger crew_applications_set_updated_at before update on public.crew_applications
  for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

-- Moderation status changes are restricted to moderators even though owners
-- may edit their own caption, details, or report.
create or replace function public.guard_gallery_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and not public.is_moderator() then
    raise exception 'gallery status can only be changed by a moderator';
  end if;
  return new;
end;
$$;

create trigger gallery_items_guard_status
  before update on public.gallery_items
  for each row execute function public.guard_gallery_status();

create or replace function public.guard_report_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and not public.is_moderator() then
    raise exception 'report status can only be changed by a moderator';
  end if;
  return new;
end;
$$;

create trigger reports_guard_status
  before update on public.reports
  for each row execute function public.guard_report_status();

-- User submits a report. Reporter identity is stored but never exposed to the
-- reported member through RLS.
create or replace function public.submit_report(
  p_target_type public.report_target_type,
  p_target_id uuid,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason, details)
  values (auth.uid(), p_target_type, p_target_id, p_reason, p_details)
  returning id into v_id;

  return v_id;
end;
$$;

-- Moderator action with an audit record.
create or replace function public.moderate_report(
  p_report_id uuid,
  p_status public.report_status,
  p_action public.moderation_action,
  p_notes text default null
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

  update public.reports
  set status = p_status,
      assigned_to = coalesce(assigned_to, auth.uid())
  where id = p_report_id;

  insert into public.moderation_actions (report_id, moderator_id, action, notes)
  values (p_report_id, auth.uid(), p_action, p_notes);

  insert into public.audit_log (actor_id, action, target_type, target_id)
  values (auth.uid(), p_action::text, 'report', p_report_id);
end;
$$;

-- Self-service removal of personal data. Auth user removal requires a
-- service-role call and is handled outside the client in a later milestone.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.audit_log (actor_id, action, target_type)
  values (auth.uid(), 'self_delete', 'profile');

  delete from public.profiles where id = auth.uid();
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;
revoke all on function public.guard_gallery_status() from public;
revoke all on function public.guard_report_status() from public;
revoke all on function public.submit_report(public.report_target_type, uuid, text, text) from public;
revoke all on function public.moderate_report(uuid, public.report_status, public.moderation_action, text) from public;
revoke all on function public.delete_my_account() from public;

grant execute on function public.submit_report(public.report_target_type, uuid, text, text) to authenticated;
grant execute on function public.moderate_report(uuid, public.report_status, public.moderation_action, text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
