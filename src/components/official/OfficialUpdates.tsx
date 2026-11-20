import Image from "next/image";
import { Container } from "@/components/ui/container";
import { TiltCard } from "@/components/ui/TiltCard";
import { createClient } from "@/lib/supabase/server";

type OfficialUpdate = {
  external_id: string;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  image_url: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "Date not published";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Singapore",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export async function OfficialUpdates({ limit = 6 }: { limit?: number }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("official_updates")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  const updates = (data ?? []) as OfficialUpdate[];

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
              Headlines and dates are synced from the official Sea of Thieves news feed. Open an item to read the full article on the official site.
            </p>
          </div>
          <a href="https://www.seaofthieves.com/news" target="_blank" rel="noopener noreferrer" className="partner-source">
            Official news ↗
          </a>
        </div>

        {updates.length === 0 ? (
          <p className="partner-empty">No official updates are available right now.</p>
        ) : (
          <div className="official-grid">
            {updates.map((update, index) => (
              <TiltCard key={update.external_id}>
                <a href={update.url} target="_blank" rel="noopener noreferrer" className="official-card">
                  {index === 0 ? (
                    <Image
                      src="/news/official-news.jpg"
                      alt="Featured Sea of Thieves official news artwork"
                      width={640}
                      height={360}
                      priority
                      className="official-card__image"
                    />
                  ) : null}
                  <div className="official-card__body">
                    <time>{formatDate(update.published_at)}</time>
                    <h3>{update.title}</h3>
                    {update.summary ? <p>{update.summary}</p> : null}
                    <span>Read on official site ↗</span>
                  </div>
                </a>
              </TiltCard>
            ))}
          </div>
        )}

        <p className="partner-credit">
          Source: Sea of Thieves official news. Sea of Thieves and related marks are trademarks of the Microsoft group of companies. This community site displays headlines and links only.
        </p>
      </Container>
    </section>
  );
}
