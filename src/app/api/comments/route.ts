import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/m8/auth";
import { commentSchema } from "@/lib/m8/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const targetType = request.nextUrl.searchParams.get("targetType") ?? "";
  const targetId = request.nextUrl.searchParams.get("targetId") ?? "";
  if (!["guide", "event"].includes(targetType) || !/^[0-9a-f-]{36}$/i.test(targetId)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ comments: [] });
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(100);
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: Request) {
  const context = await requireUser();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { supabase, user } = context;

  if (!rateLimit(`comment:${user.id}`, LIMITS.comment.limit, LIMITS.comment.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data, error } = await supabase.from("comments").insert({
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    author_id: user.id,
    body: parsed.data.body,
  }).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
