-- Owner-controlled homepage section order.
insert into public.site_settings (key, value)
values (
  'home',
  '{"sectionOrder":["live","news","discord","about","features","previews","join"]}'::jsonb
)
on conflict (key) do nothing;
