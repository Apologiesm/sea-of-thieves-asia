-- Channels are registered at runtime with /sotafeed, not hard-coded defaults.
update public.site_settings
set value = value || jsonb_build_object('channels', jsonb'[]'::jsonb),
    updated_at = now()
where key = 'discord';
