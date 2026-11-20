import { NextResponse } from "next/server";
import { requireModerator, logAudit } from "@/lib/m8/auth";
import { announcementSchema } from "@/lib/m8/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/env";
import { postToDiscord } from "@/lib/discord/notify";

export const dynamic = "force-dynamic";

async function announceToDiscord(announcement: {
  id: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  published_at: string | null;
}) {
  await postToDiscord({
    title: announcement.title,
    description: announcement.body.slice(0, 500),
    url: `${getSiteUrl()}/announcements/${announcement.id}`,
    image: announcement.cover_image_url ? { url: announcement.cover_image_url } : undefined,
    timestamp: announcement.published_at ?? new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase, user } = context;

  if (!rateLimit(`announcement:create:${user.id}`, LIMITS.guideCreate.limit, LIMITS.guideCreate.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const slug = `${parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "news"}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await supabase.from("announcements").insert({
    title: parsed.data.title,
    slug,
    body: parsed.data.body,
    category: parsed.data.category,
    cover_image_url: parsed.data.coverImageUrl,
    author_id: user.id,
    author_name: profile?.display_name ?? "Community team",
    pinned: parsed.data.pinned,
    status: parsed.data.status,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
  }).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, "announcement_created", "announcement", data.id, { status: data.status });
  if (data.status === "published") {
    await announceToDiscord(data);
  }
  return NextResponse.json({ announcement: data }, { status: 201 });
}
