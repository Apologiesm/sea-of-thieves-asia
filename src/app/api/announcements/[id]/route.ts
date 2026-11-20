import { NextResponse } from "next/server";
import { requireModerator, logAudit } from "@/lib/m8/auth";
import { announcementSchema } from "@/lib/m8/validation";
import { getSiteUrl } from "@/lib/env";
import { postToDiscord } from "@/lib/discord/notify";

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

  const { data: previous } = await supabase
    .from("announcements")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await supabase.from("announcements").update({
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
    cover_image_url: parsed.data.coverImageUrl,
    pinned: parsed.data.pinned,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, "announcement_updated", "announcement", id, { status: data.status });
  // Announce only on the draft -> published transition, never on edits.
  if (data.status === "published" && previous?.status !== "published") {
    await postToDiscord({
      title: data.title,
      description: data.body.slice(0, 500),
      url: `${getSiteUrl()}/announcements/${data.id}`,
      image: data.cover_image_url ? { url: data.cover_image_url } : undefined,
      timestamp: data.published_at ?? new Date().toISOString(),
    });
  }
  return NextResponse.json({ announcement: data });
}
