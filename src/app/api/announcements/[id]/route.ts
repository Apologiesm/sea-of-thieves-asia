import { NextResponse } from "next/server";
import { requireModerator, logAudit } from "@/lib/m8/auth";
import { announcementSchema } from "@/lib/m8/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase } = context;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data, error } = await supabase.from("announcements").update({
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
    pinned: parsed.data.pinned,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, "announcement_updated", "announcement", id, { status: data.status });
  return NextResponse.json({ announcement: data });
}
