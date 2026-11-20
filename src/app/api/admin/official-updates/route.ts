import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, logAudit } from "@/lib/m8/auth";

export const dynamic = "force-dynamic";

/**
 * Owner/admin controls for official Sea of Thieves updates: feature, hide,
 * or lightly edit the title/summary of a synced row. Syncs never overwrite
 * these flags because the sync upsert only touches its own columns.
 */
const patchSchema = z.object({
  id: z.string().min(1).max(200),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(400).nullable().optional(),
});

export async function GET() {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await context.supabase
    .from("official_updates")
    .select("external_id,title,url,summary,image_url,published_at,featured,hidden")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ updates: data ?? [] });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { id, ...changes } = parsed.data;
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("official_updates")
    .update(changes)
    .eq("external_id", id)
    .select("external_id,title,featured,hidden")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(context.supabase, "official_update_modified", "official_update", id, changes);
  return NextResponse.json({ update: data });
}
