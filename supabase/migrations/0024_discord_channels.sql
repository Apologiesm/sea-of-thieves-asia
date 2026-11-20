update public.site_settings
set value = jsonb_build_object(
  'enabled', true,
  'channelUrl', '',
  'channelId', '',
  'announcementLimit', 4,
  'channels', jsonb'[
    {
      "key": "game_updates",
      "label": "Game updates",
      "url": "https://discord.com/channels/902102549144948746/1296814423159345162",
      "id": "1296814423159345162",
      "limit": 4
    },
    {
      "key": "game_events",
      "label": "Game events",
      "url": "https://discord.com/channels/902102549144948746/1296814661651529749",
      "id": "1296814661651529749",
      "limit": 4
    }
  ]'
), updated_at = now()
where key = 'discord';
