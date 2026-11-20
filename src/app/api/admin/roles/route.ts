import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/m8/auth";
import { roleSchema } from "@/lib/m8/validation";

export async function POST(request: Request) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase } = context;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { error } = await supabase.rpc("admin_set_role", {
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
