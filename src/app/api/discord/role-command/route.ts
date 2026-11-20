import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  discord_user_id: z.string().regex(/^\d{17,20}$/),
  requested_by_discord_id: z.string().regex(/^\d{17,20}$/),
  role: z.enum(["owner", "admin", "member"]),
});

async function requesterRoles(discordId: string, token: string, guildId: string): Promise<string[] | null> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
    { headers: { Authorization: `Bot ${token}` }, cache: "no-store" },
  );
  if (!response.ok) return null;
  const member = (await response.json()) as { roles?: string[] };
  return member.roles ?? [];
}

export async function POST(request: Request) {
  const secret = process.env.DISCORD_COMMAND_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { discord_user_id, requested_by_discord_id, role } = parsed.data;
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const ownerRoleId = process.env.DISCORD_OWNER_ROLE_ID;
  const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;

  if (!token || !guildId || !ownerRoleId || !adminRoleId) {
    return NextResponse.json({ error: "missing_configuration" }, { status: 503 });
  }

  const requester = await requesterRoles(requested_by_discord_id, token, guildId);
  if (!requester) return NextResponse.json({ error: "requester_not_found" }, { status: 403 });

  const requesterIsOwner = requester.includes(ownerRoleId);
  const requesterIsAdmin = requester.includes(adminRoleId);

  if (role === "owner" && !requesterIsOwner) {
    return NextResponse.json({ error: "owner_role_required" }, { status: 403 });
  }
  if (role !== "owner" && !requesterIsOwner && !requesterIsAdmin) {
    return NextResponse.json({ error: "admin_role_required" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const { data, error } = await admin.rpc("sync_discord_member_role", {
    p_discord_id: discord_user_id,
    p_role: role,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, result: data ?? "ok", role });
}
