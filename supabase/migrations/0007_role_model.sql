-- Explicit role helpers and owner policies.
-- Roles: member (default), moderator, admin, and owner (resource owner).
-- Ownership is always checked against auth.uid(); never against client input.

create or replace function public.is_owner(p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and auth.uid() = p_owner_id;
$$;

revoke all on function public.is_owner(uuid) from public;
grant execute on function public.is_owner(uuid) to anon, authenticated;

-- Owner: profiles
create policy "owner_select_own_profile" on public.profiles
  for select to authenticated
  using (public.is_owner(id));

create policy "owner_update_own_profile" on public.profiles
  for update to authenticated
  using (public.is_owner(id))
  with check (public.is_owner(id));

-- Owner: event RSVPs
create policy "owner_manage_own_rsvp" on public.event_rsvps
  for all to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

-- Owner: gallery uploads
create policy "owner_manage_own_gallery_item" on public.gallery_items
  for all to authenticated
  using (public.is_owner(uploader_id))
  with check (public.is_owner(uploader_id));

-- Owner: crew listings and applications
create policy "owner_manage_own_crew_listing" on public.crew_listings
  for all to authenticated
  using (public.is_owner(author_id))
  with check (public.is_owner(author_id));

create policy "owner_select_own_application" on public.crew_applications
  for select to authenticated
  using (public.is_owner(applicant_id));

-- Owner: reports (reporter may read and withdraw an own open report)
create policy "owner_select_own_report" on public.reports
  for select to authenticated
  using (public.is_owner(reporter_id));

create policy "owner_delete_own_open_report" on public.reports
  for delete to authenticated
  using (public.is_owner(reporter_id) and status = 'open');

-- Member: authenticated users may read public and members-visible profiles
create policy "member_select_visible_profiles" on public.profiles
  for select to authenticated
  using (
    visibility = 'members'
    or visibility = 'public'
  );

-- Moderator: queue visibility is already granted by is_moderator() policies;
-- this policy makes the role explicit for moderation actions.
create policy "moderator_read_moderation_actions" on public.moderation_actions
  for select to authenticated
  using (public.is_moderator());

-- Admin: explicit audit visibility.
create policy "admin_read_audit_log" on public.audit_log
  for select to authenticated
  using (public.is_admin());
