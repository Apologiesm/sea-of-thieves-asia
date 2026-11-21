import { createClient } from "@/lib/supabase/server";

/**
 * Layout engine + kill switches, stored in `site_layout_config` and editable
 * live from the admin master panel. Falls back to safe defaults when the
 * table or row is missing so the public site never breaks.
 */

export const DEFAULT_HOME_ORDER = [
  "horizon",
  "fleet",
  "tavern",
  "live",
  "news",
  "discord",
  "about",
  "features",
  "previews",
  "join",
] as const;

export type HomeLayout = { order: string[]; hidden: string[] };

export type KillSwitches = {
  maintenanceMode: boolean;
  crewSubmissions: boolean;
  galleryUploads: boolean;
  officialSync: boolean;
  discordAutoPost: boolean;
};

export type NavLayout = { order: string[] };

export const DEFAULT_KILL_SWITCHES: KillSwitches = {
  maintenanceMode: false,
  crewSubmissions: true,
  galleryUploads: true,
  officialSync: true,
  discordAutoPost: true,
};

export type LayoutConfig = {
  home: HomeLayout;
  killSwitches: KillSwitches;
  nav: NavLayout;
};

export const DEFAULT_LAYOUT: LayoutConfig = {
  home: { order: [...DEFAULT_HOME_ORDER], hidden: [] },
  killSwitches: DEFAULT_KILL_SWITCHES,
  nav: { order: [] },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function getLayoutConfig(): Promise<LayoutConfig> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_LAYOUT;

  const { data } = await supabase.from("site_layout_config").select("key,value");
  const values: Record<string, unknown> = {};
  (data ?? []).forEach((row) => {
    values[row.key] = row.value;
  });

  const home = asRecord(values.home_sections);
  const ks = asRecord(values.kill_switches);
  const nav = asRecord(values.nav_order);

  return {
    home: {
      order: Array.isArray(home.order)
        ? home.order.filter((key): key is string => typeof key === "string")
        : [...DEFAULT_HOME_ORDER],
      hidden: Array.isArray(home.hidden)
        ? home.hidden.filter((key): key is string => typeof key === "string")
        : [],
    },
    killSwitches: {
      maintenanceMode: Boolean(ks.maintenanceMode ?? DEFAULT_KILL_SWITCHES.maintenanceMode),
      crewSubmissions: Boolean(ks.crewSubmissions ?? DEFAULT_KILL_SWITCHES.crewSubmissions),
      galleryUploads: Boolean(ks.galleryUploads ?? DEFAULT_KILL_SWITCHES.galleryUploads),
      officialSync: Boolean(ks.officialSync ?? DEFAULT_KILL_SWITCHES.officialSync),
      discordAutoPost: Boolean(ks.discordAutoPost ?? DEFAULT_KILL_SWITCHES.discordAutoPost),
    },
    nav: {
      order: Array.isArray(nav.order)
        ? nav.order.filter((key): key is string => typeof key === "string")
        : [],
    },
  };
}

export async function getKillSwitches(): Promise<KillSwitches> {
  return (await getLayoutConfig()).killSwitches;
}
