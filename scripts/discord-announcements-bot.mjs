import {
  Client,
  GatewayIntentBits,
  Events,
} from "discord.js";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
}

const token = process.env.DISCORD_BOT_TOKEN;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const commandSecret = process.env.DISCORD_EVENTS_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !commandSecret || !supabaseUrl || !serviceKey) {
  throw new Error("Missing DISCORD_BOT_TOKEN, DISCORD_EVENTS_SECRET, NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function channelIdFrom(channel) {
  if (channel.id?.trim()) return channel.id.trim();
  return channel.url?.match(/\/channels\/\d+\/(\d+)/)?.[1] ?? "";
}

async function getDiscordSettings() {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/site_settings?key=eq.discord&select=value`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`settings_${response.status}`);
  const rows = await response.json();
  return rows[0]?.value ?? { enabled: false, channels: [] };
}

async function syncChannel(channel) {
  const id = channelIdFrom(channel);
  if (!id) return;

  const response = await fetch(
    `https://discord.com/api/v10/channels/${id}/messages?limit=${Math.min(25, channel.limit || 4)}`,
    { headers: { Authorization: `Bot ${token}` }, cache: "no-store" },
  );

  if (!response.ok) {
    console.error(`CHANNEL_${id}_STATUS=${response.status}`);
    return;
  }

  const messages = await response.json();
  for (const message of messages) {
    if (message.author?.bot) continue;

    const payload = {
      external_id: message.id,
      channel_id: id,
      author_name: message.author?.global_name || message.author?.username || "Community member",
      content: message.content || null,
      posted_at: message.timestamp,
      image_url: message.embeds?.find((embed) => embed.image?.url)?.image?.url
        ?? message.attachments?.[0]?.url
        ?? null,
      embeds: (message.embeds ?? []).map((embed) => ({
        title: embed.title ?? null,
        description: embed.description ?? null,
        url: embed.url ?? null,
        color: embed.color ?? null,
        image: embed.image?.url ? { url: embed.image.url } : null,
        thumbnail: embed.thumbnail?.url ? { url: embed.thumbnail.url } : null,
        author: embed.author?.name ? { name: embed.author.name } : null,
        footer: embed.footer?.text ? { text: embed.footer.text } : null,
        fields: (embed.fields ?? []).map((field) => ({
          name: field.name,
          value: field.value,
          inline: Boolean(field.inline),
        })),
      })),
      attachments: (message.attachments ?? []).map((attachment) => ({
        url: attachment.url,
        contentType: attachment.content_type ?? null,
      })),
      message_url: `https://discord.com/channels/${message.guild_id ?? ""}/${id}/${message.id}`,
    };

    const post = await fetch(`${siteUrl}/api/discord/announcements`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${commandSecret}`,
      },
      body: JSON.stringify(payload),
    });
    if (!post.ok) console.error(`POST_${message.id}_STATUS=${post.status}`);
  }
}

async function syncAll() {
  const settings = await getDiscordSettings();
  if (!settings.enabled) {
    console.log("DISCORD_FEED_DISABLED");
    return;
  }
  for (const channel of settings.channels ?? []) await syncChannel(channel);
}

await syncAll();
setInterval(() => {
  syncAll().catch((error) => console.error(error instanceof Error ? error.message : "sync_failed"));
}, 60_000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, (ready) => {
  console.log(`ANNOUNCEMENTS_BOT_READY as ${ready.user.tag}`);
});
await client.login(token);
