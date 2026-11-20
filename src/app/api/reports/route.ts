import { NextResponse, type NextRequest } from "next/server";
import { requireUser, requireModerator } from "@/lib/m8/auth";
import { listReports } from "@/lib/m8/queries";
import { reportSchema } from "@/lib/m8/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TABLES: Record<string, string> = {
  profile: "profiles",
  crew_listing: "crew_listings",
  event: "events",
  comment: "comments",
  gallery_item: "gallery_items",
  guide: "guides",
  announcement: "announcements",
};

export async function GET(request: NextRequest) {
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const status = request.nextUrl.searchParams.get("status") ?? "open";
  return NextResponse.json({ reports: await listReports(status) });
}

export async function POST(request: Request) {
  const context = await requireUser();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { supabase, user } = context;

  if (!rateLimit(`report:${user.id}`, LIMITS.reportSubmit.limit, LIMITS.reportSubmit.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const table = TABLES[parsed.data.targetType];
  const { data: target } = await admin.from(table).select("id").eq("id", parsed.data.targetId).maybeSingle();
  if (!target) return NextResponse.json({ error: "target_not_found" }, { status: 404 });

  const { error } = await supabase.rpc("submit_report", {
    p_target_type: parsed.data.targetType,
    p_target_id: parsed.data.targetId,
    p_reason: parsed.data.reason,
    p_details: parsed.data.details || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
