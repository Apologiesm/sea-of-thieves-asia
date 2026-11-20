import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id,display_name,region,visibility,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: roles } = await admin.from("user_roles").select("user_id,role");
  const byUser = new Map<string, string[]>();
  (roles ?? []).forEach((row) => {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row.role);
    byUser.set(row.user_id, list);
  });

  return NextResponse.json({
    people: (profiles ?? []).map((profile) => ({
      ...profile,
      roles: byUser.get(profile.id) ?? ["member"],
    })),
  });
}
