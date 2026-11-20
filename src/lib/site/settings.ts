import { createClient } from "@/lib/supabase/server";

export type FeatureFlags = {
  events: boolean;
  crew: boolean;
  guides: boolean;
  gallery: boolean;
  news: boolean;
  discordEvents: boolean;
};

export type DiscordSettings = {
  channelUrl: string;
  channelId: string;
  announcementLimit: number;
  enabled: boolean;
};

export type SiteSettings = {
  features: FeatureFlags;
  discord: DiscordSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  features: { events: true, crew: true, guides: true, gallery: true, news: true, discordEvents: true },
  discord: { channelUrl: "", channelId: "", announcementLimit: 4, enabled: false },
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
