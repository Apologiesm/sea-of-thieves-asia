import { NextResponse } from "next/server";
import { requireModerator, logAudit } from "@/lib/m8/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(["published", "hidden", "removed"]) });
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { supabase } = context;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data, error } = await supabase
    .from("comments")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit(supabase, `comment_${parsed.data.status}`, "comment", id);
  return NextResponse.json({ comment: data });
}
