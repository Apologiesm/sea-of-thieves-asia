import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TIME_ZONE_OPTIONS } from "@/lib/time/zone";

export const dynamic = "force-dynamic";

const schema = z.object({
  timezone: z.enum(TIME_ZONE_OPTIONS.map((option) => option.value) as [string, ...string[]]),
});

/**
 * Persist the visitor's display timezone on their profile.
 *
 * Anonymous visitors are not an error: their choice already lives in the
 * cookie and localStorage, so this returns 204 and does nothing.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return new NextResponse(null, { status: 204 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 204 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_timezone" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ timezone: parsed.data.timezone })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, timezone: parsed.data.timezone });
}
