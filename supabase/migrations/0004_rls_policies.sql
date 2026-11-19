-- Row Level Security: enabled on every table, default deny.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.guides enable row level security;
alter table public.announcements enable row level security;
alter table public.gallery_items enable row level security;
alter table public.crew_listings enable row level security;
alter table public.crew_applications enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_log enable row level security;
alter table public.user_consents enable row level security;

-- profiles
create policy "profiles_select" on public.profiles
  for select to anon, authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or visibility = 'public'
    or (visibility = 'members' and auth.role() = 'authenticated')
  );

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- user_roles: read-only to clients; writes only through SECURITY DEFINER RPC
create policy "user_roles_select" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- events
create policy "events_select" on public.events
  for select to anon, authenticated
  using (status = 'published' or public.is_moderator());

create policy "events_insert_mod" on public.events
  for insert to authenticated with check (public.is_moderator());

create policy "events_update_mod" on public.events
  for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

create policy "events_delete_admin" on public.events
  for delete to authenticated using (public.is_admin());

-- event_rsvps
create policy "event_rsvps_select" on public.event_rsvps
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_id and e.created_by = auth.uid()
    )
  );

create policy "event_rsvps_insert_own" on public.event_rsvps
  for insert to authenticated with check (user_id = auth.uid());

create policy "event_rsvps_update_own" on public.event_rsvps
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "event_rsvps_delete_own" on public.event_rsvps
  for delete to authenticated using (user_id = auth.uid());

-- guides
create policy "guides_select" on public.guides
  for select to anon, authenticated
  using (status = 'published' or public.is_moderator());

create policy "guides_insert_mod" on public.guides
  for insert to authenticated with check (public.is_moderator());

create policy "guides_update_mod" on public.guides
  for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

create policy "guides_delete_admin" on public.guides
  for delete to authenticated using (public.is_admin());

-- announcements
create policy "announcements_select" on public.announcements
  for select to anon, authenticated
  using (status = 'published' or public.is_moderator());

create policy "announcements_insert_mod" on public.announcements
  for insert to authenticated with check (public.is_moderator());

create policy "announcements_update_mod" on public.announcements
  for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

create policy "announcements_delete_admin" on public.announcements
  for delete to authenticated using (public.is_admin());

-- gallery_items
create policy "gallery_items_select" on public.gallery_items
  for select to anon, authenticated
  using (
    status = 'approved'
    or public.is_moderator()
    or uploader_id = auth.uid()
  );

create policy "gallery_items_insert_own" on public.gallery_items
  for insert to authenticated with check (uploader_id = auth.uid());

create policy "gallery_items_update_own" on public.gallery_items
  for update to authenticated
  using (uploader_id = auth.uid()) with check (uploader_id = auth.uid());

create policy "gallery_items_delete_own" on public.gallery_items
  for delete to authenticated using (uploader_id = auth.uid());

-- crew_listings
create policy "crew_listings_select" on public.crew_listings
  for select to authenticated
  using (status = 'open' or author_id = auth.uid() or public.is_admin());

create policy "crew_listings_insert_own" on public.crew_listings
  for insert to authenticated with check (author_id = auth.uid());

create policy "crew_listings_update" on public.crew_listings
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "crew_listings_delete" on public.crew_listings
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- crew_applications
create policy "crew_applications_select" on public.crew_applications
  for select to authenticated
  using (
    applicant_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.crew_listings c
      where c.id = listing_id and c.author_id = auth.uid()
    )
  );

create policy "crew_applications_insert_own" on public.crew_applications
  for insert to authenticated with check (applicant_id = auth.uid());

create policy "crew_applications_update_owner" on public.crew_applications
  for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.crew_listings c
      where c.id = listing_id and c.author_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.crew_listings c
      where c.id = listing_id and c.author_id = auth.uid()
    )
  );

create policy "crew_applications_delete_own" on public.crew_applications
  for delete to authenticated
  using (applicant_id = auth.uid() and status = 'pending');

-- reports
create policy "reports_select" on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_moderator());

create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

create policy "reports_update_mod" on public.reports
  for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

create policy "reports_delete_own_open" on public.reports
  for delete to authenticated
  using (reporter_id = auth.uid() and status = 'open');

-- moderation_actions / audit_log: read-only to clients
create policy "moderation_actions_select" on public.moderation_actions
  for select to authenticated using (public.is_moderator());

create policy "audit_log_select" on public.audit_log
  for select to authenticated using (public.is_admin());

-- user_consents
create policy "user_consents_select" on public.user_consents
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "user_consents_insert_own" on public.user_consents
  for insert to authenticated with check (user_id = auth.uid());

create policy "user_consents_update_own" on public.user_consents
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
