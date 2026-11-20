import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/m8/auth";
import { z } from "zod";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["open", "in_review", "resolved", "dismissed"]),
  action: z.enum(["approve", "reject", "remove", "warn"]),
  note: z.string().max(300).default(""),
});

export async function POST(request: Request) {
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase, user } = context;

  if (!rateLimit(`report:moderate:${user.id}`, LIMITS.moderate.limit, LIMITS.moderate.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { error } = await supabase.rpc("moderate_report", {
    p_report_id: parsed.data.reportId,
    p_status: parsed.data.status,
    p_action: parsed.data.action,
    p_notes: parsed.data.note || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
