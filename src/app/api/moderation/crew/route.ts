import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderationSchema } from "@/lib/crew/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import type { CrewListing } from "@/lib/crew/types";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

async function requireModerator() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isModerator } = await supabase.rpc("is_moderator");
  if (!isModerator) return null;

  return { supabase, user };
}

export async function GET() {
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const { data: reports, error } = await admin
    .from("reports")
    .select("id,target_id,reason,details,status,created_at")
    .eq("target_type", "crew_listing")
    .in("status", ["open", "in_review"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ids = (reports ?? []).map((report) => report.target_id);
  const listings = new Map<string, CrewListing>();
  if (ids.length > 0) {
    const { data: rows } = await admin
      .from("crew_listings")
      .select("*")
      .in("id", ids);
    (rows ?? []).forEach((row) => listings.set(row.id, row as CrewListing));
  }

  return NextResponse.json({
    reports: (reports ?? []).map((report: ReportRow) => ({
      ...report,
      listing: listings.get(report.target_id) ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase, user } = context;

  if (!rateLimit(`crew:moderate:${user.id}`, LIMITS.moderate.limit, LIMITS.moderate.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const reportId = typeof body === "object" && body !== null && "reportId" in body
    ? String((body as { reportId: unknown }).reportId)
    : "";
  if (!reportId) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const { data: report } = await admin
    .from("reports")
    .select("id,target_type,target_id,status")
    .eq("id", reportId)
    .maybeSingle();

  if (!report || report.target_type !== "crew_listing") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const map = {
    hide: { listing: "hidden" as const, report: "in_review" as const, action: "reject" as const },
    remove: { listing: "removed" as const, report: "resolved" as const, action: "remove" as const },
    restore: { listing: "open" as const, report: "dismissed" as const, action: "approve" as const },
  }[parsed.data.action];

  const { error: listingError } = await supabase.rpc("moderate_crew_listing", {
    p_listing_id: report.target_id,
    p_status: map.listing,
    p_note: parsed.data.note || null,
  });
  if (listingError) return NextResponse.json({ error: listingError.message }, { status: 400 });

  const { error: reportError } = await supabase.rpc("moderate_report", {
    p_report_id: reportId,
    p_status: map.report,
    p_action: map.action,
    p_notes: parsed.data.note || null,
  });
  if (reportError) return NextResponse.json({ error: reportError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
