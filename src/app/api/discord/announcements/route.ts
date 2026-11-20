import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

const bodySchema = z.object({
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

export async function POST(request: Request) {
  const secret = process.env.DISCORD_EVENTS_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const item = parsed.data;
  const { error } = await admin.from("discord_announcements").upsert({
    external_id: item.external_id,
    channel_id: item.channel_id,
    author_name: item.author_name ?? null,
    content: item.content ?? null,
    posted_at: item.posted_at ? new Date(item.posted_at).toISOString() : null,
    image_url: item.image_url ?? item.embeds.find((embed) => embed.image?.url)?.image?.url ?? item.attachments[0]?.url ?? null,
    embeds: item.embeds,
    attachments: item.attachments,
    message_url: item.message_url ?? null,
    synced_at: new Date().toISOString(),
  }, { onConflict: "external_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
