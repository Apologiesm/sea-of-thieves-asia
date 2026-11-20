import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DiscordMember = { user?: { id?: string }; roles?: string[] };

async function fetchGuildMembers(token: string, guildId: string): Promise<DiscordMember[]> {
  const all: DiscordMember[] = [];
  let after: string | null = null;

  while (true) {
    const params = new URLSearchParams({ limit: "1000" });
    if (after) params.set("after", after);

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?${params.toString()}`,
      { headers: { Authorization: `Bot ${token}` }, cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(`discord_${response.status}`);
    }

    const page = (await response.json()) as DiscordMember[];
    all.push(...page);
    if (page.length < 1000) break;
    after = page[page.length - 1]?.user?.id ?? null;
    if (!after) break;
  }

  return all;
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;
  const ownerRoleId = process.env.DISCORD_OWNER_ROLE_ID;

  const missing = [
    !token && "DISCORD_BOT_TOKEN",
    !guildId && "DISCORD_GUILD_ID",
    !adminRoleId && "DISCORD_ADMIN_ROLE_ID",
    !ownerRoleId && "DISCORD_OWNER_ROLE_ID",
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json({ error: "missing_configuration", missing }, { status: 503 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  let members: DiscordMember[];
  try {
    members = await fetchGuildMembers(token!, guildId!);
  } catch (error) {
    return NextResponse.json(
      { error: "discord_fetch_failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    );
  }

  const discordRoles = new Map<string, string[]>();
  members.forEach((member) => {
    const id = member.user?.id;
    if (id) discordRoles.set(id, member.roles ?? []);
  });

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("discord_id")
    .not("discord_id", "is", null);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const profile of profiles ?? []) {
    const discordId = String(profile.discord_id);
    const roles = discordRoles.get(discordId);
    if (!roles) {
      skipped += 1;
      continue;
    }

    const targetRole = roles.includes(ownerRoleId!)
      ? "owner"
      : roles.includes(adminRoleId!)
        ? "admin"
        : "member";

    const { error } = await admin.rpc("sync_discord_member_role", {
      p_discord_id: discordId,
      p_role: targetRole,
    });

    if (error) errors.push(`${discordId}: ${error.message}`);
    else synced += 1;
  }

  return NextResponse.json(
    { ok: errors.length === 0, synced, skipped, errors, members: members.length },
    { status: errors.length === 0 ? 200 : 502 },
  );
}

export const GET = run;
export const POST = run;
