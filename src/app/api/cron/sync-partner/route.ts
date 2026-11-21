import { NextResponse } from "next/server";
import { syncOfficialUpdates } from "@/lib/official/sync";
import { requireModerator } from "@/lib/m8/auth";
import { getKillSwitches } from "@/lib/site/layout";

export const dynamic = "force-dynamic";

/**
 * Legacy alias for the official news sync.
 *
 * The scheduled job now lives at `/api/cron/official-news`; this route stays
 * so existing bookmarks, docs and manual triggers keep working. It is no
 * longer registered in `vercel.json`, so there is only ever one schedule.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorizedByCron = Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );

  if (authorizedByCron) {
    const switches = await getKillSwitches();
    if (!switches.officialSync) {
      return NextResponse.json({ error: "official_sync_disabled" }, { status: 503 });
    }
  } else {
    const context = await requireModerator();
    if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await syncOfficialUpdates();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export const GET = run;
export const POST = run;
