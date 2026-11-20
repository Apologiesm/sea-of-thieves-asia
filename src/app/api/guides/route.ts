import { NextResponse } from "next/server";
import { requireModerator, logAudit } from "@/lib/m8/auth";
import { guideSchema, parseTags, readingMinutes } from "@/lib/m8/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase, user } = context;

  if (!rateLimit(`guide:create:${user.id}`, LIMITS.guideCreate.limit, LIMITS.guideCreate.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = guideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const slug = `${parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "guide"}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await supabase.from("guides").insert({
    title: parsed.data.title,
    slug,
    excerpt: parsed.data.excerpt || null,
    image_url: parsed.data.imageUrl,
    body: parsed.data.body,
    category: parsed.data.category,
    tags: parseTags(parsed.data.tags),
    reading_minutes: readingMinutes(parsed.data.body),
    author_id: user.id,
    author_name: profile?.display_name ?? "Community team",
    status: parsed.data.status,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
  }).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, "guide_created", "guide", data.id, { status: data.status });
  return NextResponse.json({ guide: data }, { status: 201 });
}
