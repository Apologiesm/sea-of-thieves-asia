import { createClient } from "@/lib/supabase/server";
import {
  buildOccurrences,
  selectNextOfficial,
  type Occurrence,
  type OfficialEventRecord,
  type RecurrenceRule,
  type ScheduleException,
} from "@/lib/official/schedule";

export const EVENT_HUB_URL = "https://www.seaofthieves.com/event-hub";

export type NextOfficialEventView = {
  state: "live" | "upcoming" | "none";
  live: Occurrence | null;
  next: Occurrence | null;
  /** Wording the hub attached to the selected event, e.g. "Coming Soon". */
  flag: string | null;
  storedEvents: number;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  /** Pre-computed, so the server and client render the same words. */
  checkedLabel: string | null;
  hubUrl: string;
};

type EventRow = {
  external_id: string;
  name: string;
  category: string | null;
  flag: string | null;
  description: string | null;
  source_url: string | null;
  artwork_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  schedule_note: string | null;
  recurrence: RecurrenceRule | null;
  tier: string;
  status: string;
  featured_ship: string | null;
  checked_at: string | null;
};

function toRecord(row: EventRow): OfficialEventRecord {
  return {
    externalId: row.external_id,
    name: row.name,
    category: row.category,
    description: row.description,
    sourceUrl: row.source_url,
    artworkUrl: row.artwork_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    scheduleNote: row.schedule_note,
    recurrence: row.recurrence,
    tier: row.tier === "ambient" ? "ambient" : "headline",
    status:
      row.status === "verified" ? "verified" : row.status === "cancelled" ? "cancelled" : "unverified",
    featuredShip: row.featured_ship,
  };
}

/**
 * Read the stored official schedule and decide what is live and what is next.
 *
 * This runs per request against a handful of rows; the countdown itself is
 * client-side, so no polling is involved.
 */
function freshnessLabel(iso: string | null, now: Date): string | null {
  if (!iso) return null;
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Checked just now";
  if (minutes < 60) return `Checked ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Checked ${hours} h ago`;
  return `Checked ${Math.round(hours / 24)} d ago`;
}

export async function getNextOfficialEvent(now: Date = new Date()): Promise<NextOfficialEventView> {
  const empty: NextOfficialEventView = {
    state: "none",
    live: null,
    next: null,
    flag: null,
    storedEvents: 0,
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastError: null,
    checkedLabel: null,
    hubUrl: EVENT_HUB_URL,
  };

  const supabase = await createClient();
  if (!supabase) return empty;

  const [eventsResult, exceptionsResult, syncResult] = await Promise.all([
    supabase
      .from("official_events")
      .select(
        "external_id, name, category, flag, description, source_url, artwork_url, starts_at, ends_at, schedule_note, recurrence, tier, status, featured_ship, checked_at",
      ),
    supabase
      .from("official_event_exceptions")
      .select("event_external_id, occurs_on, kind, reason"),
    supabase
      .from("sync_state")
      .select("source, last_attempt_at, last_success_at, last_error")
      .eq("source", "official_events")
      .maybeSingle(),
  ]);

  const rows = (eventsResult.data ?? []) as EventRow[];
  if (rows.length === 0) {
    return {
      ...empty,
      lastSuccessAt: syncResult.data?.last_success_at ?? null,
      lastAttemptAt: syncResult.data?.last_attempt_at ?? null,
      lastError: syncResult.data?.last_error ?? null,
      checkedLabel: freshnessLabel(syncResult.data?.last_success_at ?? null, now),
    };
  }

  const events = rows.map(toRecord);
  const exceptions = (exceptionsResult.data ?? []).map((row) => ({
    eventExternalId: row.event_external_id as string,
    occursOn: row.occurs_on as string,
    kind: (row.kind as "skip" | "cancelled") ?? "skip",
    reason: (row.reason as string | null) ?? null,
  })) satisfies ScheduleException[];

  const occurrences = buildOccurrences(events, { now, exceptions });
  const selection = selectNextOfficial(occurrences, now);
  const selected = selection.live ?? selection.next;
  // Rows are only written after a successful read, so the newest checked_at is
  // the last verified sync. Publicly readable, unlike the admin sync_state row.
  const lastChecked = rows
    .map((row) => row.checked_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
  const selectedRow = selected
    ? rows.find((row) => row.external_id === selected.eventExternalId)
    : undefined;

  return {
    state: selection.state,
    live: selection.live,
    next: selection.next,
    flag: selectedRow?.flag ?? null,
    storedEvents: rows.length,
    lastSuccessAt: syncResult.data?.last_success_at ?? null,
    lastAttemptAt: syncResult.data?.last_attempt_at ?? null,
    lastError: syncResult.data?.last_error ?? null,
    checkedLabel: freshnessLabel(lastChecked ?? syncResult.data?.last_success_at ?? null, now),
    hubUrl: EVENT_HUB_URL,
  };
}
