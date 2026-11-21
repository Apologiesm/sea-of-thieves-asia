/**
 * Read the structured event data the Event Hub ships inside its own HTML.
 *
 * The rendered markup leaves every card image blank and paints it later with
 * client-side CSS, but the CMS also serialises its whole component tree as JSON
 * in the page. That JSON carries what the markup drops: the official artwork
 * URLs for all five responsive breakpoints, and true UTC start/end timestamps.
 *
 * So the hub is read twice, for two different jobs:
 *   - `parseEventHub` (event-hub.ts) reads the visible markup for headings,
 *     date wording and status flags, which is what the schedule engine needs.
 *   - this module reads the JSON for artwork and exact boundaries.
 *
 * No imports on purpose: it must stay testable with `node --test`.
 */

export type HubPanel = {
  /** Heading the panel shows, e.g. "Weekly Fight Nights". */
  name: string;
  /** CMS identifier, e.g. "WeeklyFightNights". Stable, unlike the heading. */
  slug: string | null;
  body: string | null;
  /** Official artwork, largest usable variant first. */
  imageUrl: string | null;
  /** Absolute UTC ISO string, or null when the panel shows no fixed window. */
  startsAt: string | null;
  endsAt: string | null;
  /** The hub's own date wording, e.g. "Twice Daily: 1am - 2am and 5pm - 6pm UTC". */
  dateString: string | null;
  ctaUrl: string | null;
};

const IMAGE_KEYS = ["desktop", "tablet", "largeDesktop", "medium-phone", "small-phone"] as const;
const PANEL_START = /\{"#Name":"([^"]*)","#Type":"EventPanel"/g;

/** Comparison key: headings vary in case and punctuation between runs. */
export function panelKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function decode(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "2026-11-25 10:00:14Z" is what the CMS writes: a space instead of the ISO
 * separator. Anything unparseable becomes null rather than a guess.
 */
export function hubTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalised = value.trim().replace(" ", "T");
  const parsed = new Date(normalised);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function absoluteUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^\/[^/]/.test(trimmed)) return `https://www.seaofthieves.com${trimmed}`;
  return null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = decode(value);
  return cleaned ? cleaned : null;
}

type ImageSet = Partial<Record<(typeof IMAGE_KEYS)[number], string>>;

function pickImage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const set = value as ImageSet;
  for (const key of IMAGE_KEYS) {
    const candidate = absoluteUrl(set[key]);
    if (candidate) return candidate;
  }
  return null;
}

type PanelSide = {
  Title?: unknown;
  BodyText?: unknown;
  Image?: unknown;
  CTA?: { Url?: unknown } | null;
};

type RawPanel = {
  "#Name"?: unknown;
  FeaturedData?: PanelSide | null;
  FallbackData?: PanelSide | null;
  StartDate?: unknown;
  EndDate?: unknown;
  DateString?: unknown;
};

/** Index of the brace closing the object that opens at `openIndex`. */
function closingBrace(html: string, openIndex: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = openIndex; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function readPanel(raw: unknown): HubPanel | null {
  if (!raw || typeof raw !== "object") return null;
  const panel = raw as RawPanel;
  const featured = panel.FeaturedData ?? {};
  const fallback = panel.FallbackData ?? {};

  const name = text(featured.Title) ?? text(fallback.Title);
  if (!name) return null;

  const startsAt = hubTimestamp(panel.StartDate);
  const endsAt = hubTimestamp(panel.EndDate);

  return {
    name,
    slug: text(panel["#Name"]),
    body: text(featured.BodyText) ?? text(fallback.BodyText),
    imageUrl: pickImage(featured.Image) ?? pickImage(fallback.Image),
    // A start without an end (or the reverse) is not a usable window.
    startsAt: startsAt && endsAt ? startsAt : null,
    endsAt: startsAt && endsAt ? endsAt : null,
    dateString: text(panel.DateString),
    ctaUrl: absoluteUrl(featured.CTA?.Url) ?? absoluteUrl(fallback.CTA?.Url),
  };
}

/**
 * Every event panel the hub serialises, in page order. Duplicate headings are
 * kept: the caller decides which copy to trust.
 */
export function parseHubPanels(html: string): HubPanel[] {
  const out: HubPanel[] = [];
  for (const match of html.matchAll(PANEL_START)) {
    const start = match.index ?? 0;
    const end = closingBrace(html, start);
    if (end < 0) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(html.slice(start, end));
    } catch {
      continue;
    }
    const panel = readPanel(parsed);
    if (panel) out.push(panel);
  }
  return out;
}

/**
 * The visible heading carries a status word ("Season 21 Live Now!") that the
 * markup parser strips, so both spellings must resolve to the same panel.
 */
function nameVariants(name: string): string[] {
  const withoutStatus = name.replace(/\b(live now|coming soon|ending soon)\b/gi, " ");
  return [panelKey(name), panelKey(withoutStatus)];
}

/** Headings and CMS slugs both address the same panel; map on all variants. */
export function indexHubPanels(panels: HubPanel[]): Map<string, HubPanel> {
  const index = new Map<string, HubPanel>();
  for (const panel of panels) {
    const keys = new Set([
      ...nameVariants(panel.name),
      panel.slug ? panelKey(panel.slug) : "",
    ]);
    for (const key of keys) {
      if (key && !index.has(key)) index.set(key, panel);
    }
  }
  return index;
}

export function findHubPanel(
  index: Map<string, HubPanel>,
  name: string,
  slug?: string | null,
): HubPanel | null {
  for (const key of [...nameVariants(name), slug ? panelKey(slug) : ""]) {
    if (!key) continue;
    const match = index.get(key);
    if (match) return match;
  }
  return null;
}
