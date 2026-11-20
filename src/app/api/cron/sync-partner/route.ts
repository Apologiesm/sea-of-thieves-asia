import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/m8/auth";
import { syncPartnerEvents } from "@/lib/partner/sync";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorizedByCron = Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );

  if (!authorizedByCron) {
    const context = await requireModerator();
    if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await syncPartnerEvents();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export const GET = run;
export const POST = run;
