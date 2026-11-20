import { createClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/lib/event/types";
import type { AnnouncementRecord } from "@/lib/m8/types";

export type LiveSnapshot = {
  current: EventRecord | null;
  next: EventRecord | null;
  updates: AnnouncementRecord[];
};

export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const supabase = await createClient();
  if (!supabase) return { current: null, next: null, updates: [] };

  const now = new Date();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true })
    .limit(50);

  const list = (events ?? []) as EventRecord[];
  const current =
    list.find(
      (event) =>
        event.starts_at &&
        new Date(event.starts_at) <= now &&
        (!event.ends_at || new Date(event.ends_at) >= now),
    ) ?? null;
  const next =
    list.find((event) => event.starts_at && new Date(event.starts_at) > now) ?? null;

  const { data: updates } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(3);

  return {
    current,
    next,
    updates: (updates ?? []) as AnnouncementRecord[],
  };
}
