import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/event/queries";
import { eventFiltersSchema, eventSchema, toEventRow } from "@/lib/event/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = eventFiltersSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "invalid_filters" }, { status: 400 });
  return NextResponse.json({ events: await listEvents(parsed.data) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: allowed } = await supabase.rpc("is_event_host");
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (!rateLimit(`event:create:${user.id}`, LIMITS.eventCreate.limit, LIMITS.eventCreate.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const base = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const slug = `${base || "event"}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await supabase
    .from("events")
    .insert({ ...toEventRow(parsed.data, slug), created_by: user.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ event: data }, { status: 201 });
}
