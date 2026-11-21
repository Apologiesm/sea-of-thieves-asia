import { NextResponse } from "next/server";
import { syncOfficialUpdates, getSyncState } from "@/lib/official/sync";
import { getKillSwitches } from "@/lib/site/layout";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The single scheduled official-content job.
 *
 * Vercel Hobby allows one run per day per cron, so this is the only schedule:
 * official news (and the freshness record the site reads back). Manual runs
 * from the owner panel use `/api/sync/official-sot`.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET`, or an admin session.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorizedByCron = Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );

  if (!authorizedByCron) {
    const { requireAdmin } = await import("@/lib/m8/auth");
    const context = await requireAdmin();
    if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } else {
    const switches = await getKillSwitches();
    if (!switches.officialSync) {
      return NextResponse.json({ error: "official_sync_disabled" }, { status: 503 });
    }
  }

  const result = await syncOfficialUpdates();
  const state = await getSyncState();

  return NextResponse.json(
    { ...result, state },
    { status: result.ok ? 200 : 502 },
  );
}

export const GET = run;
export const POST = run;
