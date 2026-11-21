/**
 * Read the official Event Hub page.
 *
 * The page is server-rendered by the official CMS, so every event it shows is
 * present in the HTML as an `event-panel` block with a heading, a date line, a
 * description, an optional status flag and an optional call-to-action link.
 * There is no public JSON API, and artwork is applied by client-side CSS, so
 * artwork is normally absent here and is enriched from the event's own page.
 *
 * This module has no imports on purpose: it is testable with `node --test` and
 * every interpretation step (date lines, recurrence) lives in `schedule.ts`.
 */

export type ParsedEventPanel = {
  name: string;
  dateLine: string | null;
  body: string | null;
  flag: string | null;
  bucket: string | null;
  link: string | null;
  artwork: string | null;
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&ndash;": "–",
  "&mdash;": "—",
  "&hellip;": "…",
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&[a-zA-Z]+;/g, (entity) => ENTITIES[entity] ?? entity);
}

export function htmlToText(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip CMS status suffixes such as "Live Now!" from a heading. */
export function cleanEventName(value: string): string {
  return htmlToText(value)
    .replace(/\s*[|\-–—]\s*(live now|coming soon|ending soon)!?\s*$/i, "")
    .replace(/\s*(live now|coming soon|ending soon)!?\s*$/i, "")
    .trim();
}

function firstMatch(source: string, pattern: RegExp): string | null {
  const match = pattern.exec(source);
  return match?.[1] ? htmlToText(match[1]) : null;
}

function artworkFrom(panel: string): string | null {
  const style = /background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/i.exec(panel);
  if (style?.[2]) return style[2];
  const dataSrc = /\bdata-(?:src|background-image|bg)=["']([^"']+)["']/i.exec(panel);
  if (dataSrc?.[1] && /^https?:\/\//i.test(dataSrc[1])) return dataSrc[1];
  const img = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/i.exec(panel);
  if (img?.[1] && /^https?:\/\//i.test(img[1])) return img[1];
  return null;
}

/**
 * Parse every event panel on the hub page, tagged with the bucket it appears
 * under ("The Main Events", "Recurring and Upcoming").
 */
export function parseEventHub(html: string): ParsedEventPanel[] {
  const bucketStarts: { index: number; name: string }[] = [];
  const bucketPattern = /<div class="event-bucket(?: [^"]*)?"[^>]*>/g;
  for (const match of html.matchAll(bucketPattern)) {
    const index = match.index ?? 0;
    const slice = html.slice(index, index + 1200);
    const heading =
      firstMatch(slice, /event-bucket__heading[^>]*>([\s\S]*?)<\/h2>/i) ??
      firstMatch(slice, /event-bucket__heading[^>]*>([\s\S]*?)<\/div>/i);
    bucketStarts.push({ index, name: heading ?? "Official events" });
  }

  const panels: { index: number; chunk: string }[] = [];
  // "event-panel-inner" must not match: allow only a space-separated modifier
  // list after the base class, never a hyphenated second class.
  const panelPattern = /<div class="event-panel(?: [^"]*)?"[^>]*>/g;
  const panelStarts = [...html.matchAll(panelPattern)].map((match) => match.index ?? 0);
  panelStarts.forEach((start, position) => {
    const next = panelStarts[position + 1] ?? html.length;
    panels.push({ index: start, chunk: html.slice(start, Math.min(next, start + 6000)) });
  });

  const out: ParsedEventPanel[] = [];
  for (const panel of panels) {
    const header =
      firstMatch(panel.chunk, /class="event-panel-inner__header[^"]*"[^>]*>([\s\S]*?)<\/h3>/i) ??
      firstMatch(panel.chunk, /<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (!header) continue;
    const name = cleanEventName(header);
    if (!name) continue;

    const bucket = [...bucketStarts].reverse().find((entry) => entry.index <= panel.index)?.name ?? null;
    const link = /class="cta"[\s\S]{0,200}?href="([^"]+)"/i.exec(panel.chunk)?.[1] ?? null;

    out.push({
      name,
      dateLine:
        firstMatch(panel.chunk, /class="event-panel-inner__date"[^>]*>([\s\S]*?)<\/div>/i) ?? null,
      body: firstMatch(panel.chunk, /class="event-panel-inner__body"[^>]*>([\s\S]*?)<\/div>/i) ?? null,
      flag:
        firstMatch(panel.chunk, /class="event-panel-inner__flag-label"[^>]*>([\s\S]*?)<\/span>/i) ??
        null,
      bucket,
      link: link ? decodeEntities(link) : null,
      artwork: artworkFrom(panel.chunk),
    });
  }

  return out;
}

/** The officially featured ship, when the notice names one. */
export function featuredShipFrom(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = /\b(sloops?|galleons?|brigs?)\b/i.exec(text);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  if (raw.startsWith("sloop")) return "Sloop";
  if (raw.startsWith("galleon")) return "Galleon";
  return "Brigantine";
}
