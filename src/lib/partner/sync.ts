import { createAdminClient } from "@/lib/supabase/admin";

const EVENTS_JS_URL =
  "https://www.seaofthievesau.com/js/calendar-events.25d3474e.js";

type PartnerEvent = {
  external_id: string;
  title: string;
  category: string | null;
  category_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  duration: string | null;
  description: string | null;
  image_url: string | null;
  thumb_url: string | null;
  badge: string | null;
  alert: string | null;
  link: string | null;
  is_sotau: boolean;
};

function parseEvents(source: string): PartnerEvent[] {
  const marker = "const SOTAU_EVENTS_DATA = [";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error("partner_event_marker_missing");
  const start = source.indexOf("[", markerIndex);
  const end = source.indexOf("\n];", start);
  if (start < 0 || end < 0) throw new Error("partner_event_array_missing");

  const raw = JSON.parse(source.slice(start, end + 2)) as Array<Record<string, unknown>>;
  const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

  return raw
    .filter((item) => text(item.id) && text(item.title) && text(item.start))
    .map((item) => ({
      external_id: String(item.id),
      title: String(item.title),
      category: text(item.category),
      category_label: text(item.categoryLabel),
      starts_at: text(item.start),
      ends_at: text(item.end),
      duration: text(item.duration),
      description: text(item.description),
      image_url: text(item.image),
      thumb_url: text(item.thumb),
      badge: text(item.badge),
      alert: text(item.alert),
      link: text(item.link),
      is_sotau: Boolean(item.isSotau),
    }));
}

export async function syncPartnerEvents() {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "admin_not_configured" };

  const response = await fetch(EVENTS_JS_URL, { cache: "no-store" });
  if (!response.ok) return { ok: false, error: `upstream_${response.status}` };

  const events = parseEvents(await response.text());
  if (events.length === 0) return { ok: false, error: "no_events_parsed" };

  const { error } = await admin
    .from("partner_events")
    .upsert(events.map((event) => ({ ...event, synced_at: new Date().toISOString() })), {
      onConflict: "external_id",
    });

  if (error) return { ok: false, error: error.message };

  return { ok: true, synced: events.length, source: EVENTS_JS_URL };
}
