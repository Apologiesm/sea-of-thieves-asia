import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Unified Discord -> Website ingestion endpoint.
 *
 * One secret-protected route that accepts both feeds the bots already send to
 * /api/discord/events and /api/discord/announcements, plus Discord webhook
 * message payloads, so a single bot integration can mirror an entire server:
 *
 *   POST /api/webhooks/discord
 *   x-discord-secret: <DISCORD_EVENTS_SECRET>
 *   { "type": "events", "events": [...] }         -> discord_events table
 *   { "type": "announcements", ...single post }   -> discord_announcements table
 *
 * Security: no bearer/Bearer mixing — the bot sends the raw secret in the
 * `x-discord-secret` header. Attachments, embed images and message URLs are
 * preserved so cards on the website show the same media as Discord.
 */

const embedSchema = z.object({
  title: z.string().max(256).nullable().optional(),
  description: z.string().max(4000).nullable().optional(),
  url: z.string().url().max(2000).nullable().optional(),
  color: z.number().int().nullable().optional(),
  image: z.object({ url: z.string().url().max(2000) }).nullable().optional(),
  thumbnail: z.object({ url: z.string().url().max(2000) }).nullable().optional(),
  author: z.object({ name: z.string().max(256) }).nullable().optional(),
  footer: z.object({ text: z.string().max(256) }).nullable().optional(),
  fields: z.array(z.object({
    name: z.string().max(256),
    value: z.string().max(1024),
    inline: z.boolean().optional(),
  })).max(25).optional(),
}).passthrough();

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

const announcementSchema = z.object({
  external_id: z.string().min(1).max(200),
  channel_id: z.string().min(1).max(100),
  author_name: z.string().max(200).nullable().optional(),
  content: z.string().max(4000).nullable().optional(),
  posted_at: z.string().datetime({ offset: true }).nullable().optional(),
  image_url: z.string().url().max(2000).nullable().optional(),
  embeds: z.array(embedSchema).max(10).default([]),
  attachments: z.array(z.object({
    url: z.string().url().max(2000),
    contentType: z.string().max(100).nullable().optional(),
  }).passthrough()).max(10).default([]),
  message_url: z.string().url().max(2000).nullable().optional(),
});

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("events"), events: z.array(eventSchema).min(1).max(50) }),
  z.object({ type: z.literal("announcement"), announcement: announcementSchema }),
]);

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = process.env.DISCORD_EVENTS_SECRET;
  if (!secret || request.headers.get("x-discord-secret") !== secret) {
    return unauthorized();
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  if (parsed.data.type === "events") {
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
    const { error } = await admin.from("discord_events").upsert(rows, { onConflict: "external_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, synced: rows.length });
  }

  const item = parsed.data.announcement;
  const { error } = await admin.from("discord_announcements").upsert({
    external_id: item.external_id,
    channel_id: item.channel_id,
    author_name: item.author_name ?? null,
    content: item.content ?? null,
    posted_at: item.posted_at ? new Date(item.posted_at).toISOString() : null,
    image_url:
      item.image_url ??
      item.embeds.find((embed) => embed.image?.url)?.image?.url ??
      item.attachments[0]?.url ??
      null,
    embeds: item.embeds,
    attachments: item.attachments,
    message_url: item.message_url ?? null,
    synced_at: new Date().toISOString(),
  }, { onConflict: "external_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
