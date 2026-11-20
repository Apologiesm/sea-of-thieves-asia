import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  let confirmation: { confirm?: string };
  try {
    confirmation = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (confirmation.confirm !== "DELETE") {
    return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
  }

  // Remove profile rows and related data using the caller's identity.
  const { error: profileError } = await supabase.rpc("delete_my_account");
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  // Auth user deletion requires the service role and stays server-only.
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
