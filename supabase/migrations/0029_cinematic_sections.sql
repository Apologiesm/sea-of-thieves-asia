-- Place the cinematic Horizon / Fleet / Tavern scenes directly after the hero
-- in the stored homepage order, without disturbing any other saved position.

update public.site_layout_config
set value = jsonb_set(
      value,
      '{order}',
      '["horizon","fleet","tavern"]'::jsonb || coalesce(value -> 'order', '[]'::jsonb)
    ),
    updated_at = now()
where key = 'home_sections'
  and value -> 'order' is not null
  and not ((value -> 'order') ? 'horizon');

-- Keep the legacy settings row aligned if it is present.
update public.site_settings
set value = jsonb_set(
      value,
      '{sectionOrder}',
      '["horizon","fleet","tavern","live","news","discord","about","features","previews","join"]'::jsonb
    ),
    updated_at = now()
where key = 'home'
  and not ((value -> 'sectionOrder') ? 'horizon');
