import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOfficialHtml } from "@/lib/official/fetch";
import { parseEventHub, featuredShipFrom, type ParsedEventPanel } from "@/lib/official/event-hub";
import { findHubPanel, indexHubPanels, parseHubPanels, type HubPanel } from "@/lib/official/hub-data";
import {
  mergeOfficialEvents,
  officialEventKey,
  parseOfficialDateLine,
  type EventTier,
  type OfficialEventRecord,
  type ParsedSchedule,
  type RecurrenceRule,
} from "@/lib/official/schedule";

/**
 * Official Sea of Thieves event synchronisation.
 *
 * One source, read three ways:
 *   1. The Event Hub markup, which is where Rare publishes every live, weekly
 *      and upcoming event together with its heading, date wording and flag.
 *   2. The Event Hub's own serialised JSON, which is the only place the card
 *      artwork and exact UTC boundaries exist — the markup leaves every image
 *      blank and paints it client-side.
 *   3. The event's own page, read only when a panel still has no artwork.
 *
 * Artwork is copied into the public `covers` bucket rather than hotlinked, so
 * every visitor request stays on our own storage and a CDN change at Rare
 * cannot leave the site with a broken image. If the copy fails the official URL
 * is used instead: a real picture beats a placeholder.
 *
 * A run that parses nothing writes nothing and records the failure: stored
 * events always survive a bad day at the source.
 */

export const EVENT_SOURCE = "official_events";
export const EVENT_HUB_URL = "https://www.seaofthieves.com/event-hub";

const MAX_ARTWORK_FETCHES = 6;
const MAX_ARTWORK_UPLOADS = 8;
const ARTWORK_BUCKET = "covers";
const ARTWORK_MAX_BYTES = 6 * 1024 * 1024;

export type EventSyncResult = {
  ok: boolean;
  processed: number;
  changed: number;
  source: string;
  error?: string;
  events?: { name: string; schedule: string; tier: EventTier }[];
};

function recurrenceFrom(schedule: ParsedSchedule): RecurrenceRule | null {
  if (schedule.kind === "weekly") {
    return {
      kind: "weekly",
      weekday: schedule.weekday,
      startTime: schedule.startTime,
      durationMinutes: schedule.durationMinutes,
    };
  }
  if (schedule.kind === "daily") {
    return { kind: "daily", times: schedule.times, durationMinutes: schedule.durationMinutes };
  }
  return null;
}

function categoryFor(schedule: ParsedSchedule): string {
  if (schedule.kind === "weekly") return "Weekly event";
  if (schedule.kind === "daily") return "Daily bonus";
  if (schedule.kind === "range") return "Special event";
  return "Official event";
}

export type ExactWindow = { startsAt: string; endsAt: string };

export function panelToRecord(
  panel: ParsedEventPanel,
  exact?: ExactWindow | null,
): OfficialEventRecord | null {
  let schedule = parseOfficialDateLine(panel.dateLine, panel.body);
  // The hub's JSON carries the same window to the second, in UTC. Prefer it for
  // dated events, and use it to rescue a panel whose prose date we could not
  // read. Recurring rules are never overwritten this way.
  if (exact && (schedule.kind === "unscheduled" || schedule.kind === "range")) {
    schedule = { kind: "range", startsAt: exact.startsAt, endsAt: exact.endsAt };
  }
  // No readable schedule means nothing to count down to. The hub wording is
  // kept out of the engine rather than guessed at.
  if (schedule.kind === "unscheduled") return null;

  const tier: EventTier = schedule.kind === "daily" ? "ambient" : "headline";
  const ship = /last ship standing/i.test(panel.name) ? featuredShipFrom(panel.body ?? panel.name) : null;

  return {
    externalId: officialEventKey(panel.name, schedule),
    name: panel.name,
    category: categoryFor(schedule),
    description: panel.body,
    sourceUrl: panel.link ?? EVENT_HUB_URL,
    artworkUrl: panel.artwork,
    startsAt: schedule.kind === "range" ? schedule.startsAt : null,
    endsAt: schedule.kind === "range" ? schedule.endsAt : null,
    scheduleNote: panel.dateLine,
    recurrence: recurrenceFrom(schedule),
    tier,
    status: "verified",
    featuredShip: ship,
  };
}

type Row = {
  external_id: string;
  name: string;
  category: string | null;
  flag: string | null;
  description: string | null;
  source_url: string | null;
  artwork_url: string | null;
  artwork_source: string | null;
  starts_at: string | null;
  ends_at: string | null;
  schedule_note: string | null;
  recurrence: RecurrenceRule | null;
  tier: string;
  status: string;
  featured_ship: string | null;
};

type DbRow = Row & { checked_at: string; verified_at: string; updated_at: string };

function toRow(
  record: OfficialEventRecord,
  flag: string | null,
  checkedAt: string,
  artworkSource: string | null,
): DbRow {
  return {
    external_id: record.externalId,
    name: record.name,
    category: record.category,
    flag,
    description: record.description,
    source_url: record.sourceUrl,
    artwork_url: record.artworkUrl,
    artwork_source: artworkSource,
    starts_at: record.startsAt,
    ends_at: record.endsAt,
    schedule_note: record.scheduleNote,
    recurrence: record.recurrence,
    tier: record.tier,
    status: record.status,
    featured_ship: record.featuredShip ?? null,
    checked_at: checkedAt,
    verified_at: checkedAt,
    updated_at: checkedAt,
  };
}

function fromRow(row: Row): OfficialEventRecord {
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

/** Recover artwork from the event's own page (Open Graph image). */
async function artworkFor(url: string | null): Promise<string | null> {
  if (!url || !/^https:\/\/www\.seaofthieves\.com\//i.test(url) || url === EVENT_HUB_URL) return null;
  const page = await fetchOfficialHtml(url);
  if (!page) return null;
  const image =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(page.html)?.[1] ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(page.html)?.[1] ??
    null;
  if (!image) return null;
  const absolute = image.startsWith("//") ? `https:${image}` : image;
  return /^https:\/\//i.test(absolute) ? absolute : null;
}

/** Stable storage path per event, so a re-copy overwrites instead of piling up. */
export function artworkPath(externalId: string): string {
  const slug = externalId
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return `official/${slug || "official-event"}.jpg`;
}

/**
 * Copy an official image into public storage and return its permanent URL.
 * Returns null on any failure so the caller can fall back to the source URL.
 */
async function storeArtwork(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  externalId: string,
  sourceUrl: string,
): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!contentType.startsWith("image/")) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 1024 || bytes.byteLength > ARTWORK_MAX_BYTES) return null;

    const path = artworkPath(externalId);
    const { error } = await admin.storage.from(ARTWORK_BUCKET).upload(path, bytes, {
      contentType,
      cacheControl: "604800",
      upsert: true,
    });
    if (error) return null;
    return admin.storage.from(ARTWORK_BUCKET).getPublicUrl(path).data.publicUrl ?? null;
  } catch {
    return null;
  }
}

async function recordRun(result: EventSyncResult): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const now = new Date().toISOString();
  await admin.from("sync_state").upsert(
    {
      source: EVENT_SOURCE,
      last_attempt_at: now,
      last_success_at: result.ok ? now : null,
      last_error: result.error ?? null,
      records_processed: result.processed,
      records_changed: result.changed,
      updated_at: now,
    },
    { onConflict: "source" },
  );
}

export async function syncOfficialEvents(options?: { now?: Date }): Promise<EventSyncResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, processed: 0, changed: 0, source: "none", error: "admin_not_configured" };

  const page = await fetchOfficialHtml(EVENT_HUB_URL);
  if (!page) {
    const result: EventSyncResult = {
      ok: false,
      processed: 0,
      changed: 0,
      source: "none",
      error: "event_hub_unreachable",
    };
    await recordRun(result);
    return result;
  }

  const panels = parseEventHub(page.html);
  const hubIndex = indexHubPanels(parseHubPanels(page.html));
  const flags = new Map<string, string | null>();
  const hubById = new Map<string, HubPanel>();
  const parsed: OfficialEventRecord[] = [];
  const seen = new Set<string>();

  for (const panel of panels) {
    const hub = findHubPanel(hubIndex, panel.name, null);
    const exact: ExactWindow | null =
      hub?.startsAt && hub.endsAt ? { startsAt: hub.startsAt, endsAt: hub.endsAt } : null;
    const record = panelToRecord(panel, exact);
    if (!record) continue;
    if (seen.has(record.externalId)) continue; // duplicate announcement
    seen.add(record.externalId);
    flags.set(record.externalId, panel.flag);
    if (hub?.imageUrl) hubById.set(record.externalId, hub);
    parsed.push(record);
  }

  if (parsed.length === 0) {
    const result: EventSyncResult = {
      ok: false,
      processed: 0,
      changed: 0,
      source: page.finalUrl,
      error: "no_events_parsed",
    };
    await recordRun(result);
    return result;
  }

  const { data: existingRows } = await admin
    .from("official_events")
    .select(
      "external_id, name, category, flag, description, source_url, artwork_url, artwork_source, starts_at, ends_at, schedule_note, recurrence, tier, status, featured_ship",
    );
  const existing = (existingRows ?? []).map((row) => fromRow(row as Row));
  const existingById = new Map(existing.map((event) => [event.externalId, event]));
  const previous = new Map(
    (existingRows ?? []).map((row) => [row.external_id as string, row as Row]),
  );

  const merged = mergeOfficialEvents(parsed, existing);

  // Artwork, in two tiers. The hub's own JSON gives the real card for every
  // event; that file is copied into storage once and reused until Rare changes
  // it. Only a panel the JSON never describes falls back to its own page.
  const artworkSource = new Map<string, string | null>();
  let uploads = 0;
  let fetches = 0;
  for (const record of merged) {
    const published = hubById.get(record.externalId)?.imageUrl ?? null;
    if (published) {
      const previousSource = previous.get(record.externalId)?.artwork_source ?? null;
      const alreadyMirrored =
        previousSource === published &&
        typeof record.artworkUrl === "string" &&
        record.artworkUrl.includes("/storage/v1/object/public/");
      if (alreadyMirrored) {
        artworkSource.set(record.externalId, published);
        continue;
      }
      if (uploads < MAX_ARTWORK_UPLOADS) {
        uploads += 1;
        const stored = await storeArtwork(admin, record.externalId, published);
        // A failed copy still leaves the real picture on screen, served from
        // the official CDN the CSP already trusts.
        record.artworkUrl = stored ?? published;
        artworkSource.set(record.externalId, published);
      }
      continue;
    }

    if (record.artworkUrl) continue;
    if (fetches >= MAX_ARTWORK_FETCHES) break;
    if (existingById.get(record.externalId)?.artworkUrl) continue;
    fetches += 1;
    record.artworkUrl = await artworkFor(record.sourceUrl);
  }

  const checkedAt = (options?.now ?? new Date()).toISOString();
  const rows = merged.map((record) =>
    toRow(
      record,
      flags.get(record.externalId) ?? null,
      checkedAt,
      artworkSource.has(record.externalId)
        ? artworkSource.get(record.externalId) ?? null
        : previous.get(record.externalId)?.artwork_source ?? null,
    ),
  );

  const changed = rows.filter((row) => {
    const before = previous.get(row.external_id);
    if (!before) return true;
    return (
      before.name !== row.name ||
      before.description !== row.description ||
      before.starts_at !== row.starts_at ||
      before.ends_at !== row.ends_at ||
      before.schedule_note !== row.schedule_note ||
      JSON.stringify(before.recurrence) !== JSON.stringify(row.recurrence) ||
      before.artwork_url !== row.artwork_url ||
      before.artwork_source !== row.artwork_source ||
      before.flag !== row.flag ||
      before.status !== row.status
    );
  }).length;

  const { error } = await admin
    .from("official_events")
    .upsert(rows, { onConflict: "external_id" });
  if (error) {
    const result: EventSyncResult = {
      ok: false,
      processed: rows.length,
      changed: 0,
      source: page.finalUrl,
      error: `upsert_failed: ${error.message}`,
    };
    await recordRun(result);
    return result;
  }

  const result: EventSyncResult = {
    ok: true,
    processed: rows.length,
    changed,
    source: page.finalUrl,
    events: merged.map((record) => {
      const schedule = parseOfficialDateLine(record.scheduleNote, record.description);
      return {
        name: record.name,
        schedule: schedule.kind === "range" ? `${record.startsAt} → ${record.endsAt ?? "open"}` : record.scheduleNote ?? "unscheduled",
        tier: record.tier,
      };
    }),
  };
  await recordRun(result);
  return result;
}
