import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { eventSchema, toEventRow } from "@/lib/event/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`event:edit:${user.id}`, LIMITS.eventEdit.limit, LIMITS.eventEdit.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { data: existing, error: findError } = await supabase
    .from("events")
    .select("id,created_by")
    .eq("id", id)
    .maybeSingle();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: allowed } = await supabase.rpc("is_event_host");
  if (!allowed && existing.created_by !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

  const { data, error } = await supabase
    .from("events")
    .update(toEventRow(parsed.data))
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ event: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
