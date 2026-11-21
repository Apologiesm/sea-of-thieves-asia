import Link from "next/link";
import { Container } from "@/components/ui/container";
import { TiltCard } from "@/components/ui/TiltCard";
import { createClient } from "@/lib/supabase/server";
import { getViewerTimeZone } from "@/lib/time/viewer";
import { DATE_OPTIONS, formatInTimeZone } from "@/lib/time/zone";
import { getSyncState } from "@/lib/official/sync";

type OfficialUpdate = {
  external_id: string;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  image_url: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
};

function relativeFreshness(iso: string | null): string {
  if (!iso) return "Not synchronised yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Not synchronised yet";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 60) return `Checked ${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `Checked ${hours} h ago`;
  return `Last successful sync ${new Date(iso).toISOString().slice(0, 10)}`;
}

export async function OfficialUpdates({ limit = 6 }: { limit?: number }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const [timeZone, state, query] = await Promise.all([
    getViewerTimeZone(),
    getSyncState(),
    supabase
      .from("official_updates")
      .select("*")
      .or("hidden.is.null,hidden.eq.false")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit),
  ]);

  const updates = (query.data ?? []) as OfficialUpdate[];
  const freshness = relativeFreshness(state?.lastSuccessAt ?? null);

  return (
    <section aria-labelledby="official-updates-title" className="official-section">
      <Container>
        <div className="partner-heading">
          <div>
            <p className="partner-eyebrow">Official game news</p>
            <h2 id="official-updates-title" className="mt-2 text-2xl font-semibold text-content sm:text-3xl">
              Updates from Sea of Thieves
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-muted">
              Headlines, images and dates come from the official Sea of Thieves news feed.
              Every card opens the original article on seaofthieves.com.
            </p>
            <p className="mt-2 text-xs text-content-muted">
              <span className="text-brand">{freshness}</span>
              {state?.lastError ? " · last run reported an issue, stored articles kept" : null}
              {" · "}
              <Link href="/announcements" className="underline underline-offset-4">
                Community announcements are separate
              </Link>
            </p>
          </div>
          <a href="https://www.seaofthieves.com/news" target="_blank" rel="noopener noreferrer" className="partner-source">
            Official news ↗
          </a>
        </div>

        {updates.length === 0 ? (
          <p className="partner-empty">
            No official updates are available right now. The daily sync will publish them here.
          </p>
        ) : (
          <div className="official-grid">
            {updates.map((update) => (
              <TiltCard key={update.external_id}>
                <a href={update.url} target="_blank" rel="noopener noreferrer" className="official-card">
                  {update.video_thumbnail_url ?? update.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(update.video_thumbnail_url ?? update.image_url) as string}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="official-card__image"
                    />
                  ) : (
                    <span className="official-card__image official-card__image--fallback" aria-hidden="true">
                      <span>Sea of Thieves</span>
                    </span>
                  )}
                  <div className="official-card__body">
                    <span className="official-card__meta">
                      <time dateTime={update.published_at ?? undefined}>
                        {formatInTimeZone(update.published_at, timeZone, DATE_OPTIONS, "Date not published")}
                      </time>
                      {update.video_url ? <span className="official-card__video">Video</span> : null}
                    </span>
                    <h3>{update.title}</h3>
                    {update.summary ? <p>{update.summary}</p> : null}
                    <span className="official-card__link">
                      {update.video_url ? "Watch on the official site ↗" : "Read on official site ↗"}
                    </span>
                  </div>
                </a>
              </TiltCard>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
