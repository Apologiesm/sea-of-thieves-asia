import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, logAudit } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const TABLES: Record<string, string> = {
  announcement: "announcements",
  event: "events",
  guide: "guides",
  gallery_item: "gallery_items",
  report: "reports",
  crew_listing: "crew_listings",
  comment: "comments",
  discord_announcement: "discord_announcements",
  discord_event: "discord_events",
};

const schema = z.object({
  type: z.enum(Object.keys(TABLES) as [keyof typeof TABLES, ...Array<keyof typeof TABLES>]),
  id: z.string().min(1).max(100),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const context = await requireOwner();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const table = TABLES[parsed.data.type];
  const { error } = await admin.from(table).delete().eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (UUID.test(parsed.data.id)) {
    await logAudit(context.supabase, "master_delete", parsed.data.type, parsed.data.id, { table });
  }
  return NextResponse.json({ ok: true });
}
