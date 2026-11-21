import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Official Sea of Thieves news synchronisation.
 *
 * Source strategy, in order:
 *   1. Official RSS feed (structured, cheapest, most reliable).
 *   2. Official news page HTML (Open Graph, JSON-LD, article links).
 *   3. Read-only text proxy (r.jina.ai) as a last resort.
 *
 * The first adapter that returns usable items wins. A failed run never
 * replaces stored rows with nothing: the upsert only writes parsed items, and
 * images from an earlier successful run are preserved when a later parse has
 * no image. Every run records its outcome in `sync_state`.
 */

const SOURCE = "official_news";
const NEWS_URL = "https://www.seaofthieves.com/news";
const RSS_URL = "https://www.seaofthieves.com/news.rss";
const PROXY_NEWS = "https://r.jina.ai/http://www.seaofthieves.com/news";
const PROXY_RSS = "https://r.jina.ai/http://www.seaofthieves.com/news.rss";

const MAX_ITEMS = 20;
const MAX_ENRICH = 8;
const FETCH_TIMEOUT_MS = 12_000;

export type ParsedUpdate = {
  external_id: string;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  image_url: string | null;
  image_source: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
};

export type SyncResult = {
  ok: boolean;
  source?: string;
  processed?: number;
  changed?: number;
  error?: string;
};

// One run at a time per server instance; a second concurrent request is told
// to try again rather than writing overlapping updates.
let running = false;

function clean(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function absolute(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://www.seaofthieves.com${url}`;
  return url;
}

function isOfficialImage(url: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.)*(rare-assets\.azureedge\.net|seaofthieves\.com|microsoft\.com)\//i.test(url);
}

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "text/html,application/xhtml+xml,application/xml,text/xml,*/*" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function slugFromUrl(url: string): string {
  const path = url.split("?")[0];
  return path.split("/").filter(Boolean).pop() ?? path;
}

function titleFromSlug(slug: string): string {
  const month = /^this-month-([a-z]+)(\d{4})$/.exec(slug);
  if (month) {
    const name = month[1].charAt(0).toUpperCase() + month[1].slice(1);
    return `This Month in Sea of Thieves: ${name} ${month[2]}`;
  }
  const season = /^season(\d+)-(.+)$/.exec(slug);
  if (season) {
    const rest = season[2].replace(/-/g, " ");
    return `Season ${season[1]}: ${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
  }
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

// --- Adapter 1: RSS ---------------------------------------------------------

function parseRss(xml: string): ParsedUpdate[] {
  const items: ParsedUpdate[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks) {
    const link = clean(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "");
    if (!/^https:\/\/www\.seaofthieves\.com\/news\//i.test(link)) continue;

    const rawTitle = clean(block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ?? "");
    const description = clean(
      block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ?? "",
    );
    const published = toIso(clean(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? ""));
    const media =
      block.match(/<media:content[^>]*url="([^"]+)"/i)?.[1] ??
      block.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1] ??
      block.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1] ??
      null;

    const slug = slugFromUrl(link);
    items.push({
      external_id: slug,
      title: (rawTitle || titleFromSlug(slug)).slice(0, 200),
      url: link,
      published_at: published,
      summary: description ? description.slice(0, 400) : null,
      image_url: media && isOfficialImage(media) ? absolute(media) : null,
      image_source: media ? "rss-media" : null,
      video_url: null,
      video_thumbnail_url: null,
    });
    if (items.length >= MAX_ITEMS) break;
  }

  return items;
}

// --- Adapter 2: official HTML ------------------------------------------------

type JsonLdArticle = {
  headline?: string;
  datePublished?: string;
  description?: string;
  image?: string | string[] | { url?: string };
  url?: string;
};

function parseJsonLd(html: string): JsonLdArticle[] {
  const out: JsonLdArticle[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      const data = JSON.parse(match[1]) as JsonLdArticle | JsonLdArticle[] | { "@graph": JsonLdArticle[] };
      const list = Array.isArray(data)
        ? data
        : "@graph" in data && Array.isArray(data["@graph"])
          ? data["@graph"]
          : [data as JsonLdArticle];
      list.forEach((entry) => {
        if (entry && (entry.headline || entry.url)) out.push(entry);
      });
    } catch {
      // Ignore malformed structured data; other adapters still run.
    }
  }
  return out;
}

function imageFromJsonLd(entry: JsonLdArticle): string | null {
  const image = entry.image;
  if (!image) return null;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return image[0] ?? null;
  return image.url ?? null;
}

function parseNewsHtml(html: string): ParsedUpdate[] {
  const byUrl = new Map<string, ParsedUpdate>();
  const structured = parseJsonLd(html);

  const structuredImage = (url: string): string | null => {
    const entry = structured.find((item) => item.url && item.url.includes(slugFromUrl(url)));
    return entry ? imageFromJsonLd(entry) : null;
  };

  // Article cards: link text followed by a date, as rendered by the news index.
  const cardPattern =
    /<a[^>]+href="(?:https:\/\/www\.seaofthieves\.com)?(\/news\/[a-z0-9-]+)"[^>]*>([\s\S]{0,400}?)<\/a>/gi;
  for (const match of html.matchAll(cardPattern)) {
    const href = absolute(match[1]);
    const slug = slugFromUrl(href);
    if (!slug || byUrl.has(href)) continue;

    const inner = match[2];
    const headingMatch = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i.exec(inner);
    const text = clean(headingMatch?.[1] ?? inner);
    const img =
      /<img[^>]+src="([^"]+)"[^>]*>/i.exec(inner)?.[1] ?? null;
    const dateMatch = /([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/.exec(clean(inner));

    byUrl.set(href, {
      external_id: slug,
      title: (text || titleFromSlug(slug)).slice(0, 200),
      url: href,
      published_at: toIso(dateMatch?.[1] ?? null),
      summary: null,
      image_url: img && isOfficialImage(absolute(img)) ? absolute(img) : null,
      image_source: img ? "listing-thumb" : null,
      video_url: null,
      video_thumbnail_url: null,
    });
    if (byUrl.size >= MAX_ITEMS) break;
  }

  // Structured-data articles not present as cards.
  structured.forEach((entry) => {
    const raw = entry.url ? absolute(entry.url) : "";
    if (!/^https:\/\/www\.seaofthieves\.com\/news\//i.test(raw)) return;
    if (byUrl.has(raw)) return;
    const slug = slugFromUrl(raw);
    const image = imageFromJsonLd(entry);
    byUrl.set(raw, {
      external_id: slug,
      title: clean(entry.headline ?? "") || titleFromSlug(slug),
      url: raw,
      published_at: toIso(entry.datePublished ?? null),
      summary: entry.description ? clean(entry.description).slice(0, 400) : null,
      image_url: image && isOfficialImage(image) ? image : null,
      image_source: image ? "json-ld" : null,
      video_url: null,
      video_thumbnail_url: null,
    });
  });

  // Attach any structured image we found to card entries that lack one.
  byUrl.forEach((item, url) => {
    if (item.image_url) return;
    const image = structuredImage(url);
    if (image && isOfficialImage(image)) {
      item.image_url = image;
      item.image_source = "json-ld";
    }
  });

  return Array.from(byUrl.values());
}

// --- Adapter 3: text proxy fallback -----------------------------------------

function parseProxyMarkdown(markdown: string): ParsedUpdate[] {
  const items: ParsedUpdate[] = [];
  const seen = new Set<string>();
  const pattern = /\[([^\]]{3,200})\]\((https:\/\/www\.seaofthieves\.com\/news\/[a-z0-9-]+)\)/g;

  for (const match of markdown.matchAll(pattern)) {
    const url = match[2];
    if (seen.has(url)) continue;
    seen.add(url);
    const slug = slugFromUrl(url);
    const title = clean(match[1]);
    if (!title || /^(read more|news|skip to content)$/i.test(title)) continue;

    items.push({
      external_id: slug,
      title: (title || titleFromSlug(slug)).slice(0, 200),
      url,
      published_at: null,
      summary: null,
      image_url: null,
      image_source: null,
      video_url: null,
      video_thumbnail_url: null,
    });
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

// --- Per-article enrichment --------------------------------------------------

function extractYouTube(html: string): { video: string | null; thumb: string | null } {
  const id =
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/.exec(html)?.[1] ??
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/.exec(html)?.[1] ??
    /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(html)?.[1] ??
    null;

  if (!id) return { video: null, thumb: null };
  return {
    video: `https://www.youtube.com/watch?v=${id}`,
    thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

async function enrich(item: ParsedUpdate): Promise<ParsedUpdate> {
  const html = await fetchText(item.url);
  if (!html) return item;

  const ogImage =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html)?.[1] ??
    null;
  const twitterImage =
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ?? null;
  const ogDescription =
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ?? null;
  const publishedMeta =
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ??
    null;
  const { video, thumb } = extractYouTube(html);

  const image = ogImage ?? twitterImage;
  return {
    ...item,
    image_url: image && isOfficialImage(absolute(image)) ? absolute(image) : item.image_url,
    image_source: image ? "og:image" : item.image_source,
    summary: item.summary ?? (ogDescription ? clean(ogDescription).slice(0, 400) : null),
    published_at: item.published_at ?? toIso(publishedMeta),
    video_url: video,
    video_thumbnail_url: thumb,
  };
}

// --- Orchestration -----------------------------------------------------------

async function collect(): Promise<{ items: ParsedUpdate[]; source: string }> {
  const directRss = await fetchText(RSS_URL);
  if (directRss) {
    const items = parseRss(directRss);
    if (items.length) return { items, source: RSS_URL };
  }

  const directHtml = await fetchText(NEWS_URL);
  if (directHtml) {
    const items = parseNewsHtml(directHtml);
    if (items.length) return { items, source: NEWS_URL };
  }

  const proxyRss = await fetchText(PROXY_RSS);
  if (proxyRss) {
    const items = parseRss(proxyRss);
    if (items.length) return { items, source: PROXY_RSS };
  }

  const proxyNews = await fetchText(PROXY_NEWS);
  if (proxyNews) {
    const items = parseProxyMarkdown(proxyNews);
    if (items.length) return { items, source: PROXY_NEWS };
  }

  return { items: [], source: "none" };
}

async function recordRun(
  result: { ok: boolean; processed: number; changed: number; error?: string },
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const now = new Date().toISOString();
  await admin.from("sync_state").upsert(
    {
      source: SOURCE,
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

export async function syncOfficialUpdates(): Promise<SyncResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "admin_not_configured" };
  if (running) return { ok: false, error: "sync_already_running" };

  running = true;
  try {
    const { items, source } = await collect();
    if (items.length === 0) {
      await recordRun({ ok: false, processed: 0, changed: 0, error: "no_updates_parsed" });
      return { ok: false, error: "no_updates_parsed" };
    }

    // Existing rows decide which images must be preserved and what changed.
    const { data: existingRows } = await admin
      .from("official_updates")
      .select("external_id, title, summary, image_url, video_url, published_at");
    const existing = new Map(
      (existingRows ?? []).map((row) => [row.external_id as string, row]),
    );

    const enrichTargets = items
      .filter((item) => !item.image_url || !item.video_url)
      .slice(0, MAX_ENRICH);
    const enriched = new Map<string, ParsedUpdate>();
    for (const item of enrichTargets) {
      enriched.set(item.external_id, await enrich(item));
    }

    let changed = 0;
    const rows = items.map((item) => {
      const withMedia = enriched.get(item.external_id) ?? item;
      const previous = existing.get(item.external_id);

      const image = withMedia.image_url ?? (previous?.image_url as string | null) ?? null;
      const row = {
        external_id: withMedia.external_id,
        title: withMedia.title,
        url: withMedia.url,
        published_at: withMedia.published_at ?? (previous?.published_at as string | null) ?? null,
        summary: withMedia.summary ?? (previous?.summary as string | null) ?? null,
        image_url: image,
        image_source: withMedia.image_source ?? (image ? "previous" : null),
        video_url: withMedia.video_url ?? (previous?.video_url as string | null) ?? null,
        video_thumbnail_url: withMedia.video_thumbnail_url,
        source_url: source,
        synced_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
      };

      if (
        !previous ||
        previous.title !== row.title ||
        previous.summary !== row.summary ||
        previous.image_url !== row.image_url ||
        previous.video_url !== row.video_url
      ) {
        changed += 1;
      }
      return row;
    });

    const { error } = await admin
      .from("official_updates")
      .upsert(rows, { onConflict: "external_id" });

    if (error) {
      await recordRun({ ok: false, processed: rows.length, changed: 0, error: error.message });
      return { ok: false, error: error.message };
    }

    await recordRun({ ok: true, processed: rows.length, changed });
    return { ok: true, source, processed: rows.length, changed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync_failed";
    await recordRun({ ok: false, processed: 0, changed: 0, error: message });
    return { ok: false, error: message };
  } finally {
    running = false;
  }
}

/** Last recorded run, for the admin panel and the news page freshness note. */
export async function getSyncState(): Promise<{
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  records: number;
} | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("sync_state")
    .select("*")
    .eq("source", SOURCE)
    .maybeSingle();
  if (!data) return null;
  return {
    lastSuccessAt: (data.last_success_at as string | null) ?? null,
    lastAttemptAt: (data.last_attempt_at as string | null) ?? null,
    lastError: (data.last_error as string | null) ?? null,
    records: (data.records_processed as number | null) ?? 0,
  };
}
