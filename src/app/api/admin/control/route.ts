import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, logAudit } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SETTINGS } from "@/lib/site/settings";

export const dynamic = "force-dynamic";

const schema = z.object({
  features: z.object({
    events: z.boolean(),
    crew: z.boolean(),
    guides: z.boolean(),
    gallery: z.boolean(),
    news: z.boolean(),
    discordEvents: z.boolean(),
  }),
  discord: z.object({
    enabled: z.boolean(),
    channels: z.array(z.object({
      key: z.string().max(60),
      label: z.string().min(1).max(100),
      url: z.string().max(500),
      id: z.string().max(100),
      limit: z.coerce.number().int().min(1).max(25),
    })).max(8),
  }),
  home: z.object({
    sectionOrder: z.array(z.string().max(60)).max(12),
  }),
});

export async function GET() {
  const context = await requireOwner();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data } = await context.supabase.from("site_settings").select("key,value");
  const values: Record<string, unknown> = {};
  (data ?? []).forEach((row) => { values[row.key] = row.value; });
  return NextResponse.json({
    features: { ...DEFAULT_SETTINGS.features, ...(values.features as object ?? {}) },
    discord: { ...DEFAULT_SETTINGS.discord, ...(values.discord as object ?? {}) },
    home: { ...DEFAULT_SETTINGS.home, ...(values.home as object ?? {}) },
  });
}

export async function PUT(request: Request) {
  const context = await requireOwner();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const rows = [
    { key: "features", value: parsed.data.features, updated_at: new Date().toISOString() },
    { key: "discord", value: parsed.data.discord, updated_at: new Date().toISOString() },
    { key: "home", value: parsed.data.home, updated_at: new Date().toISOString() },
  ];
  const { error } = await admin.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(context.supabase, "site_settings_updated", "site_settings", "root", {
    features: Object.keys(parsed.data.features).filter((key) => parsed.data.features[key as keyof typeof parsed.data.features]),
  });
  return NextResponse.json({ ok: true });
}
