import { createClient } from "@/lib/supabase/server";

export type FeatureFlags = {
  events: boolean;
  crew: boolean;
  guides: boolean;
  gallery: boolean;
  news: boolean;
  discordEvents: boolean;
};

export type DiscordChannel = {
  key: string;
  label: string;
  url: string;
  id: string;
  limit: number;
};

export type DiscordSettings = {
  enabled: boolean;
  channels: DiscordChannel[];
};

export type SiteSettings = {
  features: FeatureFlags;
  discord: DiscordSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  features: { events: true, crew: true, guides: true, gallery: true, news: true, discordEvents: true },
  discord: {
    enabled: true,
    channels: [
      {
        key: "game_updates",
        label: "Game updates",
        url: "https://discord.com/channels/902102549144948746/1296814423159345162",
        id: "1296814423159345162",
        limit: 4,
      },
      {
        key: "game_events",
        label: "Game events",
        url: "https://discord.com/channels/902102549144948746/1296814661651529749",
        id: "1296814661651529749",
        limit: 4,
      },
    ],
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data } = await supabase.from("site_settings").select("key,value");
  const values: Record<string, unknown> = {};
  (data ?? []).forEach((row) => {
    values[row.key] = row.value;
  });

  return {
    features: { ...DEFAULT_SETTINGS.features, ...(values.features as Partial<FeatureFlags> ?? {}) },
    discord: { ...DEFAULT_SETTINGS.discord, ...(values.discord as Partial<DiscordSettings> ?? {}) },
  };
}
