import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listCrewListings } from "@/lib/crew/queries";
import { crewFiltersSchema, crewListingSchema, toCrewRow } from "@/lib/crew/validation";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/env";
import { postToDiscord } from "@/lib/discord/notify";
import { getKillSwitches } from "@/lib/site/layout";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = crewFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_filters" }, { status: 400 });
  }
  return NextResponse.json({ listings: await listCrewListings(parsed.data) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const switches = await getKillSwitches();
  if (!switches.crewSubmissions || switches.maintenanceMode) {
    return NextResponse.json({ error: "crew_submissions_disabled" }, { status: 503 });
  }

  if (!rateLimit(`crew:create:${user.id}`, LIMITS.create.limit, LIMITS.create.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = crewListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crew_listings")
    .insert({ ...toCrewRow(parsed.data), author_id: user.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (data.status === "open") {
    await postToDiscord({
      title: `LFG: ${data.title}`,
      description: data.description?.slice(0, 500) ?? undefined,
      url: `${getSiteUrl()}/crew/${data.id}`,
      image: data.image_url ? { url: data.image_url } : undefined,
      fields: [
        { name: "Seats", value: `${data.seats_filled}/${data.seats_total}`, inline: true },
        ...(data.region ? [{ name: "Region", value: data.region, inline: true }] : []),
        ...(data.platform ? [{ name: "Platform", value: data.platform, inline: true }] : []),
      ],
    });
  }
  return NextResponse.json({ listing: data }, { status: 201 });
}
