-- Security audit fix: event hosts must be able to read their own drafts.
create policy "events_select_host" on public.events
  for select to authenticated
  using (created_by = auth.uid() or public.is_event_host());

comment on policy "events_select_host" on public.events is
  'Allows hosts to manage their own drafts without exposing them publicly.';
