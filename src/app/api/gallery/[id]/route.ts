import { NextResponse } from "next/server";
import { requireModerator, requireUser, logAudit } from "@/lib/m8/auth";
import { galleryModerationSchema } from "@/lib/m8/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase, user } = context;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = galleryModerationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data, error } = await supabase.from("gallery_items").update({
    status: parsed.data.status,
    moderated_by: user.id,
    moderated_at: new Date().toISOString(),
  }).eq("id", id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, `gallery_${parsed.data.status}`, "gallery_item", id);
  return NextResponse.json({ item: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const context = await requireUser();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { supabase, user } = context;

  const { data: item } = await supabase.from("gallery_items").select("uploader_id,storage_path").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (item.uploader_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (admin) await admin.storage.from("gallery").remove([item.storage_path]);

  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, "gallery_deleted", "gallery_item", id);
  return NextResponse.json({ ok: true });
}
