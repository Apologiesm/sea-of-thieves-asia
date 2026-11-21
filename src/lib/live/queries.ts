import { createClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/lib/event/types";
import type { AnnouncementRecord } from "@/lib/m8/types";
import { getEventStatus } from "@/lib/time/zone";

export type LiveSnapshot = {
  current: EventRecord | null;
  next: EventRecord | null;
  updates: AnnouncementRecord[];
};

/**
 * Live board data.
 *
 * `current` is an event whose window contains "now" (start <= now <= end),
 * `next` is the soonest event that has not finished. Both are derived from
 * stored UTC timestamps, never from a manual "live" flag.
 */
export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const supabase = await createClient();
  if (!supabase) return { current: null, next: null, updates: [] };

  const now = Date.now();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .eq("is_enabled", true)
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true })
    .limit(50);

  const list = (events ?? []) as EventRecord[];
  const live = list.filter((event) => getEventStatus(event, now) === "live");
  const scheduled = list
    .filter((event) => getEventStatus(event, now) === "scheduled")
    .sort((a, b) => new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime());

  const { data: updates } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .eq("is_enabled", true)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(3);

  return {
    current: live[0] ?? null,
    next: scheduled[0] ?? null,
    updates: (updates ?? []) as AnnouncementRecord[],
  };
}
