import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/m8/auth";
import { syncOfficialUpdates } from "@/lib/official/sync";
import { getKillSwitches } from "@/lib/site/layout";

export const dynamic = "force-dynamic";

/**
 * Official Sea of Thieves news sync.
 *
 * - `POST` with a signed-in admin session (the "Sync Official SoT News Now"
 *   button in the owner control center), or
 * - `POST` with `Authorization: Bearer CRON_SECRET` for scheduled runs
 *   (registered in vercel.json, same pattern as /api/cron/sync-partner).
 *
 * Fetches https://www.seaofthieves.com/news, deduplicates by slug/source URL,
 * and upserts into `official_updates` with the `source: 'official'` badge.
 */
export async function POST(request: Request) {
  const bearer = process.env.CRON_SECRET;
  const isCron = Boolean(bearer) && request.headers.get("authorization") === `Bearer ${bearer}`;
  if (!isCron) {
    const context = await requireAdmin();
    if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await logAudit(context.supabase, "official_updates_synced", "official_updates", "root", {
      trigger: "admin_button",
    });
  } else {
    // Master kill-switch: stop scheduled syncs without blocking a manual run.
    const switches = await getKillSwitches();
    if (!switches.officialSync) {
      return NextResponse.json({ error: "official_sync_disabled" }, { status: 503 });
    }
  }

  const result = await syncOfficialUpdates();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
