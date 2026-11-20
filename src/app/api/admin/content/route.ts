import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, logAudit } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTENT_TYPES, allowedColumns, type ContentType } from "@/lib/admin/content";

export const dynamic = "force-dynamic";

/**
 * Master content API — owner/admin only.
 *
 * GET    /api/admin/content?type=events            list every row (any status)
 * GET    /api/admin/content?type=events&id=<id>    single row
 * PATCH  /api/admin/content {type,id,patch}         edit any allowed column
 * POST   /api/admin/content {type,ids,patch}        bulk edit
 * DELETE /api/admin/content?type=events&id=<id>     permanent delete
 * POST   /api/admin/content {type,ids,action:"delete"} bulk delete
 *
 * Authorization is enforced server-side through requireAdmin() (which calls the
 * is_admin() RPC, and owner is implicitly admin). The write itself uses the
 * service-role client so the master override cannot be blocked by a narrower
 * owner-scoped RLS policy; RLS still grants admins full access as defence in
 * depth (migration 0028).
 */

const typeSchema = z.enum([
  "events",
  "guides",
  "announcements",
  "gallery_items",
  "crew_listings",
  "comments",
  "official_updates",
]);

function specFor(type: ContentType) {
  return CONTENT_TYPES[type];
}

const patchSchema = z.record(z.string(), z.unknown());

const bulkSchema = z.object({
  type: typeSchema,
  ids: z.array(z.string().min(1).max(100)).min(1).max(100),
  action: z.enum(["delete"]).optional(),
  patch: patchSchema.optional(),
});

function sanitizePatch(type: ContentType, raw: Record<string, unknown>) {
  const spec = specFor(type);
  const columns = new Set(allowedColumns(spec));
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!columns.has(key)) continue;
    if (key === "tags" && typeof value === "string") {
      patch[key] = value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12);
      continue;
    }
    patch[key] = value;
  }
  return patch;
}

export async function GET(request: NextRequest) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const parsedType = typeSchema.safeParse(request.nextUrl.searchParams.get("type"));
  if (!parsedType.success) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  const spec = specFor(parsedType.data);

  const id = request.nextUrl.searchParams.get("id");
  let query = admin.from(spec.table).select("*").limit(200);
  query = id
    ? query.eq("id", id)
    : query.order("sort_order", { ascending: true }).order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ type: spec.type, items: data ?? [] });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | { type?: string; id?: string; patch?: Record<string, unknown> }
    | null;

  const parsedType = typeSchema.safeParse(body?.type);
  if (!parsedType.success) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  if (!body?.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const spec = specFor(parsedType.data);
  const patch = sanitizePatch(parsedType.data, body.patch ?? {});
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 400 });
  }

  const { data, error } = await admin
    .from(spec.table)
    .update(patch)
    .eq("id", body.id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(context.supabase, "master_edit", spec.type, body.id, {
    fields: Object.keys(patch),
  });
  return NextResponse.json({ item: data });
}

export async function POST(request: Request) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const spec = specFor(parsed.data.type);

  if (parsed.data.action === "delete") {
    const { error } = await admin.from(spec.table).delete().in("id", parsed.data.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logAudit(context.supabase, "master_bulk_delete", spec.type, parsed.data.ids[0], {
      count: parsed.data.ids.length,
    });
    return NextResponse.json({ ok: true, affected: parsed.data.ids.length });
  }

  const patch = sanitizePatch(parsed.data.type, parsed.data.patch ?? {});
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 400 });
  }

  const { error } = await admin.from(spec.table).update(patch).in("id", parsed.data.ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(context.supabase, "master_bulk_edit", spec.type, parsed.data.ids[0], {
    count: parsed.data.ids.length,
    fields: Object.keys(patch),
  });
  return NextResponse.json({ ok: true, affected: parsed.data.ids.length });
}

export async function DELETE(request: NextRequest) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsedType = typeSchema.safeParse(request.nextUrl.searchParams.get("type"));
  const id = request.nextUrl.searchParams.get("id");
  if (!parsedType.success) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const spec = specFor(parsedType.data);
  const { error } = await admin.from(spec.table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(context.supabase, "master_delete", spec.type, id, { table: spec.table });
  return NextResponse.json({ ok: true });
}
