import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventFilters, EventRecord, RsvpStatus } from "@/lib/event/types";
import { getEventStatus } from "@/lib/time/zone";

export async function listEvents(filters: EventFilters, includeAll = false): Promise<EventRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  // Past events read most-recent-first; upcoming events read soonest-first.
  const ascending = filters.when !== "past";
  const nowIso = new Date().toISOString();

  let query = supabase.from("events").select("*").eq("is_enabled", true);

  // The time window is decided by the END of a voyage, not its start. An event
  // that started an hour ago is still live, never "past".
  if (filters.when === "upcoming") {
    query = query.or(`ends_at.gte.${nowIso},and(ends_at.is.null,starts_at.gte.${nowIso})`);
  } else if (filters.when === "past") {
    query = query.or(`ends_at.lt.${nowIso},and(ends_at.is.null,starts_at.lt.${nowIso})`);
  }

  if (!includeAll && filters.status !== "all") query = query.eq("status", filters.status);
  if (includeAll && filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  // Cancelled voyages are never public inventory, even when listing "all".
  if (filters.status === "all") query = query.neq("status", "cancelled");
  if (filters.type) query = query.eq("event_type", filters.type);
  if (filters.region) query = query.ilike("region", `%${filters.region}%`);
  if (filters.platform) query = query.ilike("platform", `%${filters.platform}%`);
  if (filters.date) {
    const next = new Date(`${filters.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    query = query
      .gte("starts_at", `${filters.date}T00:00:00.000Z`)
      .lt("starts_at", next.toISOString());
  }

  // Public feeds are chronological. Curated order only breaks ties and can
  // never push a later voyage above an earlier one.
  if (filters.when === "upcoming" || filters.when === "past") {
    query = query
      .order("starts_at", { ascending })
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });
  } else {
    query = query
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending });
  }

  const { data, error } = await query.limit(100);
  if (error) return [];
  return (data ?? []) as EventRecord[];
}

/**
 * The next voyage to promote: the soonest event that has not finished, so a
 * currently running session is preferred over one later in the week.
 */
export function getNextEvent(events: EventRecord[], now: number = Date.now()): EventRecord | null {
  const candidates = events
    .filter((event) => {
      const lifecycle = getEventStatus(event, now);
      return lifecycle === "scheduled" || lifecycle === "live";
    })
    .sort((a, b) => {
      const aLive = getEventStatus(a, now) === "live" ? 0 : 1;
      const bLive = getEventStatus(b, now) === "live" ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime();
    });
  return candidates[0] ?? null;
}

export async function getEvent(id: string): Promise<EventRecord | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as EventRecord;
}

export async function getRsvpCounts(eventId: string): Promise<Record<RsvpStatus, number>> {
  const empty: Record<RsvpStatus, number> = { going: 0, maybe: 0, cant_go: 0 };
  const admin = createAdminClient();
  if (!admin) return empty;

  const { data } = await admin
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId);

  (data ?? []).forEach((row) => {
    if (row.status in empty) empty[row.status as RsvpStatus] += 1;
  });
  return empty;
}

export async function getMyRsvp(eventId: string): Promise<RsvpStatus | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? (data.status as RsvpStatus) : null;
}
