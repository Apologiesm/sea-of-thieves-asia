import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile, type EditableProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: EditableProfile;
  try {
    payload = (await request.json()) as EditableProfile;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  let updates;
  try {
    updates = normalizeProfile(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid_input" },
      { status: 400 },
    );
  }

  // The user id comes from the authenticated session, never from the client.
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
