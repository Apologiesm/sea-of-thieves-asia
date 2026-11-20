import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";

/**
 * Website -> Discord outbound notifications.
 *
 * Reads the outgoing Discord webhook URL configured by the owner in the
 * control center (site_settings.discord.outgoingWebhookUrl) and posts one
 * rich embed. Never throws: a missing webhook or a Discord outage must not
 * block the content write that triggered it, and errors are logged only.
 */

export type DiscordEmbed = {
  title: string;
  description?: string;
  url?: string;
  image?: { url: string };
  timestamp?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
};

/** Warm brass accent matching the site brand colour (#c8a45c). */
const EMBED_COLOR = 0xc8a45c;

export async function getOutgoingWebhookUrl(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "discord")
    .maybeSingle();
  const value = data?.value as { outgoingWebhookUrl?: unknown } | null;
  const url = typeof value?.outgoingWebhookUrl === "string" ? value.outgoingWebhookUrl.trim() : "";
  if (!url || !url.startsWith("https://")) return null;
  return url;
}

export async function postToDiscord(embed: DiscordEmbed): Promise<boolean> {
  try {
    const webhookUrl = await getOutgoingWebhookUrl();
    if (!webhookUrl) return false;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Sea of Thieves Asia",
        embeds: [
          {
            color: EMBED_COLOR,
            footer: { text: "Sea of Thieves Asia · unofficial fan community" },
            ...embed,
            url: embed.url ?? getSiteUrl(),
          },
        ],
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`discord_webhook_failed status=${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("discord_webhook_failed", error);
    return false;
  }
}

/** Discord relative timestamp, rendered in each viewer's local time. */
export function discordTimestamp(iso: string, style: "F" | "R" = "F"): string {
  const seconds = Math.floor(new Date(iso).getTime() / 1000);
  if (Number.isNaN(seconds)) return "";
  return `<t:${seconds}:${style}>`;
}
