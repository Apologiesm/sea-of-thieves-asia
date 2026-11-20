import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, logAudit } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_LAYOUT, getLayoutConfig } from "@/lib/site/layout";

export const dynamic = "force-dynamic";

const schema = z.object({
  home: z
    .object({
      order: z.array(z.string().max(60)).max(20),
      hidden: z.array(z.string().max(60)).max(20),
    })
    .optional(),
  killSwitches: z
    .object({
      maintenanceMode: z.boolean(),
      crewSubmissions: z.boolean(),
      galleryUploads: z.boolean(),
      officialSync: z.boolean(),
      discordAutoPost: z.boolean(),
    })
    .optional(),
  nav: z.object({ order: z.array(z.string().max(200)).max(20) }).optional(),
});

export async function GET() {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(await getLayoutConfig());
}

export async function PUT(request: Request) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const current = await getLayoutConfig();
  const next = {
    home_sections: parsed.data.home ?? { ...DEFAULT_LAYOUT.home, ...current.home },
    kill_switches: parsed.data.killSwitches ?? current.killSwitches,
    nav_order: parsed.data.nav ?? current.nav,
  };

  const rows = Object.entries(next).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await admin.from("site_layout_config").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(context.supabase, "layout_updated", "site_layout_config", "root", {
    keys: Object.keys(next),
  });
  return NextResponse.json({ ok: true });
}
