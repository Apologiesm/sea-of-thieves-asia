import { createAdminClient } from "@/lib/supabase/admin";

const NEWS_PAGE = "https://r.jina.ai/http://www.seaofthieves.com/news";
const NEWS_RSS = "https://r.jina.ai/http://www.seaofthieves.com/news.rss";

type OfficialUpdate = {
  external_id: string;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  image_url: string | null;
};

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseDates(markdown: string): Map<string, string> {
  const dates = new Map<string, string>();
  const pattern = /\[(https:\/\/www\.seaofthieves\.com\/news\/[a-z0-9-]+)\]\([^)]*\)[ \t\r]*\n+([A-Za-z]{3}, \d{1,2} [A-Za-z]{3} \d{4})/g;
  for (const match of markdown.matchAll(pattern)) {
    const url = match[1];
    const parsed = new Date(match[2]);
    if (!Number.isNaN(parsed.getTime())) dates.set(url, parsed.toISOString());
  }
  return dates;
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
  const styled = /^style-of-thieves-season(\d+)$/.exec(slug);
  if (styled) return `Season ${styled[1]} Style of Thieves Theme Reveal`;
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const GENERIC_TITLES = new Set([
  "Read More", "News", "Sign up Now", "Skip To Content", "See More", "Read More →",
]);

function parseUpdates(news: string, rss: string): OfficialUpdate[] {
  const dates = parseDates(rss);
  const featuredImage = news.match(/!\[Image 1:[^\]]*\]\((https:\/\/rare-assets\.azureedge\.net\/[^)\s]+)\)/)?.[1] ?? null;
  const seen = new Set<string>();
  const updates: OfficialUpdate[] = [];

  const pattern = /\[([^\]]+)\]\((https:\/\/www\.seaofthieves\.com\/news\/[a-z0-9-]+)\)/g;
  for (const match of news.matchAll(pattern)) {
    const rawTitle = clean(match[1]);
    const url = match[2];
    if (!rawTitle || GENERIC_TITLES.has(rawTitle) || seen.has(url)) continue;
    seen.add(url);

    const slug = url.split("/").pop() ?? url;
    const title = titleFromSlug(slug).slice(0, 200);
    const summary = rawTitle.length > 0 ? rawTitle.slice(0, 400) : null;

    updates.push({
      external_id: slug,
      title,
      url,
      published_at: dates.get(url) ?? null,
      summary,
      image_url: updates.length === 0 ? featuredImage : null,
    });
    if (updates.length >= 20) break;
  }

  return updates;
}

export async function syncOfficialUpdates() {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "admin_not_configured" };

  const [newsResponse, rssResponse] = await Promise.all([
    fetch(NEWS_PAGE, { cache: "no-store" }),
    fetch(NEWS_RSS, { cache: "no-store" }),
  ]);
  if (!newsResponse.ok || !rssResponse.ok) {
    return { ok: false, error: `upstream_${newsResponse.status}_${rssResponse.status}` };
  }

  const updates = parseUpdates(await newsResponse.text(), await rssResponse.text());
  if (updates.length === 0) return { ok: false, error: "no_updates_parsed" };

  const { error } = await admin
    .from("official_updates")
    .upsert(updates.map((item) => ({ ...item, synced_at: new Date().toISOString() })), {
      onConflict: "external_id",
    });

  if (error) return { ok: false, error: error.message };

  return { ok: true, synced: updates.length, source: "https://www.seaofthieves.com/news" };
}
