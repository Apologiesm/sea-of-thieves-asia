-- Owner-controlled site settings and feature flags.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select" on public.site_settings;
create policy "site_settings_select" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "site_settings_admin_write" on public.site_settings;
create policy "site_settings_admin_write" on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;

insert into public.site_settings (key, value)
values
  ('features', '{"events":true,"crew":true,"guides":true,"gallery":true,"news":true,"discordEvents":true}'::jsonb),
  ('discord', '{"channelUrl":"","channelId":"","announcementLimit":4,"enabled":false}'::jsonb)
on conflict (key) do nothing;
