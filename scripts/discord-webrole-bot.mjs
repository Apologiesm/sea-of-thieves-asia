import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
}

const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const commandSecret = process.env.DISCORD_COMMAND_SECRET;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!token || !applicationId || !guildId || !commandSecret) {
  throw new Error("Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID or DISCORD_COMMAND_SECRET");
}

const command = new SlashCommandBuilder()
  .setName("webrole")
  .setDescription("Set a member's website role")
  .addUserOption((option) => option.setName("member").setDescription("Member to update").setRequired(true))
  .addStringOption((option) =>
    option
      .setName("role")
      .setDescription("Website role to assign")
      .setRequired(true)
      .addChoices(
        { name: "owner", value: "owner" },
        { name: "admin", value: "admin" },
        { name: "member", value: "member" },
      ),
  );

const rest = new REST({ version: "10" }).setToken(token);
await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
  body: [command.toJSON()],
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (ready) => {
  console.log(`WEBROLE_BOT_READY as ${ready.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "webrole") return;

  const member = interaction.options.getUser("member", true);
  const role = interaction.options.getString("role", true);
  await interaction.deferReply({ ephemeral: true });

  try {
    const response = await fetch(`${siteUrl}/api/discord/role-command`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${commandSecret}`,
      },
      body: JSON.stringify({
        discord_user_id: member.id,
        requested_by_discord_id: interaction.user.id,
        role,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      await interaction.editReply(`Failed: ${data.error ?? "unknown_error"}`);
      return;
    }

    if (data.result === "profile_not_found") {
      await interaction.editReply("That member has not signed into the website yet.");
      return;
    }

    await interaction.editReply(`Website role set to **${role}** for ${member.tag}.`);
  } catch (error) {
    await interaction.editReply(`Failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
});

await client.login(token);
