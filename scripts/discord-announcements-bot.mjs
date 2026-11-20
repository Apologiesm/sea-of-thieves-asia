import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  MessageFlags,
} from "discord.js";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
}

const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const ownerRoleId = process.env.DISCORD_OWNER_ROLE_ID;
const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const commandSecret = process.env.DISCORD_EVENTS_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !applicationId || !commandSecret || !supabaseUrl || !serviceKey) {
  throw new Error("Missing Discord bot settings, site URL or Supabase service key");
}

function channelIdFrom(channel) {
  if (channel.id?.trim()) return channel.id.trim();
  return channel.url?.match(/\/channels\/\d+\/(\d+)/)?.[1] ?? "";
}

const supabaseHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
};

async function getDiscordSettings() {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/site_settings?key=eq.discord&select=value`,
    { headers: supabaseHeaders, cache: "no-store" },
  );
  if (!response.ok) throw new Error(`settings_${response.status}`);
  const rows = await response.json();
  const value = rows[0]?.value ?? {};
  return { enabled: Boolean(value.enabled), channels: Array.isArray(value.channels) ? value.channels : [] };
}

async function saveDiscordSettings(value) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/site_settings?key=eq.discord`,
    {
      method: "PATCH",
      headers: { ...supabaseHeaders, "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ value, updated_at: new Date().toISOString() }),
    },
  );
  if (!response.ok) throw new Error(`save_settings_${response.status}`);
}

async function canConfigure(interaction) {
  if (!ownerRoleId && !adminRoleId) return true;
  const roles = interaction.member?.roles?.cache
    ? [...interaction.member.roles.cache.keys()]
    : (interaction.member?.roles ?? []);
  return Boolean(roles.includes(ownerRoleId) || roles.includes(adminRoleId));
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
      headers: { "content-type": "application/json", authorization: `Bearer ${commandSecret}` },
      body: JSON.stringify(payload),
    });
    if (!post.ok) console.error(`POST_${message.id}_STATUS=${post.status}`);
  }
}

async function syncAll() {
  const settings = await getDiscordSettings();
  if (!settings.enabled || settings.channels.length === 0) return;
  for (const channel of settings.channels) await syncChannel(channel);
}

const feedCommand = new SlashCommandBuilder()
  .setName("sotafeed")
  .setDescription("Configure which Discord channels appear on the website")
  .addSubcommand((sub) => sub
    .setName("add")
    .setDescription("Add a channel to the website feed")
    .addChannelOption((option) => option
      .setName("channel")
      .setDescription("Channel to sync")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption((option) => option.setName("label").setDescription("Display label").setMaxLength(100))
    .addIntegerOption((option) => option.setName("limit").setDescription("Recent posts to show (1-25)").setMinValue(1).setMaxValue(25)))
  .addSubcommand((sub) => sub
    .setName("remove")
    .setDescription("Remove a channel from the website feed")
    .addChannelOption((option) => option.setName("channel").setDescription("Channel to remove").setRequired(true)))
  .addSubcommand((sub) => sub
    .setName("limit")
    .setDescription("Set how many posts a channel shows")
    .addChannelOption((option) => option.setName("channel").setDescription("Channel").setRequired(true))
    .addIntegerOption((option) => option.setName("value").setDescription("Posts to show (1-25)").setRequired(true).setMinValue(1).setMaxValue(25)))
  .addSubcommand((sub) => sub.setName("list").setDescription("List configured channels"))
  .addSubcommand((sub) => sub.setName("enable").setDescription("Enable the Discord feed"))
  .addSubcommand((sub) => sub.setName("disable").setDescription("Disable the Discord feed"));

const rest = new REST({ version: "10" }).setToken(token);
const route = guildId
  ? Routes.applicationGuildCommands(applicationId, guildId)
  : Routes.applicationCommands(applicationId);
await rest.put(route, { body: [feedCommand.toJSON()] });

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, (ready) => {
  console.log(`FEED_BOT_READY as ${ready.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "sotafeed") return;
  if (!await canConfigure(interaction)) {
    await interaction.reply({ content: "Owner or Admin Discord role required.", flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    const settings = await getDiscordSettings();
    settings.channels = Array.isArray(settings.channels) ? settings.channels : [];
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") {
      const channel = interaction.options.getChannel("channel", true);
      const id = channel.id;
      const existing = settings.channels.find((item) => item.id === id);
      const label = interaction.options.getString("label") || channel.name;
      const limit = interaction.options.getInteger("limit") || 4;
      const url = `https://discord.com/channels/${interaction.guildId}/${id}`;
      if (!existing && settings.channels.length >= 8) {
        await interaction.reply({ content: "Maximum 8 channels. Remove one first.", flags: MessageFlags.Ephemeral });
        return;
      }
      if (existing) Object.assign(existing, { label, limit, url });
      else settings.channels.push({ key: `channel-${id}`, label, url, id, limit });
      settings.enabled = true;
      await saveDiscordSettings(settings);
      await interaction.reply({ content: `Added **${label}** to the website feed.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (subcommand === "remove") {
      const channel = interaction.options.getChannel("channel", true);
      settings.channels = settings.channels.filter((item) => item.id !== channel.id);
      await saveDiscordSettings(settings);
      await interaction.reply({ content: `Removed ${channel.name} from the feed.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (subcommand === "limit") {
      const channel = interaction.options.getChannel("channel", true);
      const value = interaction.options.getInteger("value", true);
      const item = settings.channels.find((entry) => entry.id === channel.id);
      if (!item) {
        await interaction.reply({ content: "That channel is not configured.", flags: MessageFlags.Ephemeral });
        return;
      }
      item.limit = value;
      await saveDiscordSettings(settings);
      await interaction.reply({ content: `${item.label} now shows ${value} posts.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (subcommand === "list") {
      const lines = settings.channels.length
        ? settings.channels.map((item) => `• ${item.label}: ${item.id} (${item.limit} posts)`).join("\n")
        : "No channels configured.";
      await interaction.reply({ content: `Feed: ${settings.enabled ? "on" : "off"}\n${lines}`, flags: MessageFlags.Ephemeral });
      return;
    }

    settings.enabled = subcommand === "enable";
    await saveDiscordSettings(settings);
    await interaction.reply({ content: `Discord feed ${settings.enabled ? "enabled" : "disabled"}.`, flags: MessageFlags.Ephemeral });
  } catch (error) {
    await interaction.reply({ content: `Failed: ${error instanceof Error ? error.message : "unknown"}`, flags: MessageFlags.Ephemeral });
  }
});

await syncAll();
setInterval(() => {
  syncAll().catch((error) => console.error(error instanceof Error ? error.message : "sync_failed"));
}, 60_000);

await client.login(token);
