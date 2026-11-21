import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_TIME_ZONE,
  TIME_ZONE_COOKIE,
  isValidTimeZone,
  resolveTimeZone,
} from "@/lib/time/zone";

/**
 * The visitor's display timezone for this request.
 *
 * UTC unless the visitor has explicitly chosen something. The browser's own
 * timezone is never used to override this.
 */
export async function getViewerTimeZone(): Promise<string> {
  const store = await cookies();
  const raw = store.get(TIME_ZONE_COOKIE)?.value ?? null;
  // The cookie is written percent-encoded (Asia/Tokyo -> Asia%2FTokyo).
  let cookieValue: string | null = raw;
  if (raw) {
    try {
      cookieValue = decodeURIComponent(raw);
    } catch {
      cookieValue = raw;
    }
  }

  if (isValidTimeZone(cookieValue)) return cookieValue;

  // First visit on this device: adopt the signed-in member's saved choice.
  const supabase = await createClient();
  if (!supabase) return DEFAULT_TIME_ZONE;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_TIME_ZONE;

  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  return resolveTimeZone((data as { timezone?: string | null } | null)?.timezone ?? null);
}
