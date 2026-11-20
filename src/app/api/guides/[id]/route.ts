import { NextResponse } from "next/server";
import { requireModerator, logAudit } from "@/lib/m8/auth";
import { guideSchema, parseTags, readingMinutes } from "@/lib/m8/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase, user } = context;

  if (!rateLimit(`guide:edit:${user.id}`, LIMITS.edit.limit, LIMITS.edit.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = guideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data, error } = await supabase.from("guides").update({
    title: parsed.data.title,
    excerpt: parsed.data.excerpt || null,
    body: parsed.data.body,
    category: parsed.data.category,
    tags: parseTags(parsed.data.tags),
    reading_minutes: readingMinutes(parsed.data.body),
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, "guide_updated", "guide", id, { status: data.status });
  return NextResponse.json({ guide: data });
}
