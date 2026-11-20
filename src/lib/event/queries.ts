import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventFilters, EventRecord, RsvpStatus } from "@/lib/event/types";

export async function listEvents(filters: EventFilters, includeAll = false): Promise<EventRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true })
    .limit(100);

  if (!includeAll && filters.status !== "all") query = query.eq("status", filters.status);
  if (includeAll && filters.status && filters.status !== "all") query = query.eq("status", filters.status);
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

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as EventRecord[];
}

export function getNextEvent(events: EventRecord[]): EventRecord | null {
  const now = Date.now();
  return events.find(
    (event) => event.starts_at && new Date(event.starts_at).getTime() > now,
  ) ?? null;
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
