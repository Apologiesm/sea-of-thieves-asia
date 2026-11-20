import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  external_id: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  image_url: z.string().url().max(2000).nullable().optional(),
  starts_at: z.string().datetime({ offset: true }).nullable().optional(),
  ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  event_url: z.string().url().max(2000).nullable().optional(),
  source_url: z.string().url().max(2000).nullable().optional(),
});

const bodySchema = z.object({ events: z.array(eventSchema).min(1).max(50) });

export async function POST(request: Request) {
  const secret = process.env.DISCORD_EVENTS_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const rows = parsed.data.events.map((event) => ({
    external_id: event.external_id,
    title: event.title,
    description: event.description ?? null,
    image_url: event.image_url ?? null,
    starts_at: event.starts_at ? new Date(event.starts_at).toISOString() : null,
    ends_at: event.ends_at ? new Date(event.ends_at).toISOString() : null,
    event_url: event.event_url ?? null,
    source_url: event.source_url ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await admin
    .from("discord_events")
    .upsert(rows, { onConflict: "external_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, synced: rows.length });
}
