/**
 * Shared access to official Sea of Thieves pages.
 *
 * seaofthieves.com sits behind an Azure WAF that answers non-browser clients
 * with 403, so a direct request is attempted first and only then the read-only
 * proxy is asked for the raw HTML. Both news and event synchronisation use this
 * single helper: one place to change, one behaviour to test.
 */

export const OFFICIAL_PROXY_PREFIX = "https://r.jina.ai/";
export const OFFICIAL_TIMEOUT_MS = 12_000;
const PROXY_TIMEOUT_MS = 20_000;

/** Fetch a URL as text. Returns null instead of throwing on any failure. */
export async function fetchOfficialText(
  url: string,
  timeoutMs: number = OFFICIAL_TIMEOUT_MS,
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "text/html,application/xhtml+xml,application/xml,text/xml,*/*" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export type OfficialHtml = { html: string; viaProxy: boolean; finalUrl: string };

/**
 * Fetch a page as HTML, falling back to the proxy when the official host
 * refuses the request. `viaProxy` records which path was used so synchronisers
 * can report the real source instead of claiming direct access.
 */
export async function fetchOfficialHtml(url: string): Promise<OfficialHtml | null> {
  const direct = await fetchOfficialText(url);
  if (direct && direct.includes("<")) return { html: direct, viaProxy: false, finalUrl: url };

  try {
    const response = await fetch(`${OFFICIAL_PROXY_PREFIX}${url}`, {
      cache: "no-store",
      headers: { accept: "text/html", "X-Return-Format": "html" },
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const html = await response.text();
    if (!html.includes("<")) return null;
    return { html, viaProxy: true, finalUrl: `${OFFICIAL_PROXY_PREFIX}${url}` };
  } catch {
    return null;
  }
}
