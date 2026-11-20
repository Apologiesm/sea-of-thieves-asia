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

export type HomeSettings = {
  sectionOrder: string[];
};

export type SiteSettings = {
  features: FeatureFlags;
  discord: DiscordSettings;
  home: HomeSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  features: { events: true, crew: true, guides: true, gallery: true, news: true, discordEvents: true },
  discord: {
    enabled: true,
    channels: [],
  },
  home: {
    sectionOrder: ["live", "news", "discord", "about", "features", "previews", "join"],
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
    home: { ...DEFAULT_SETTINGS.home, ...(values.home as Partial<HomeSettings> ?? {}) },
  };
}
