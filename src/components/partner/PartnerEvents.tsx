import Image from "next/image";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/event/time";

type PartnerEvent = {
  external_id: string;
  title: string;
  category_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  description: string | null;
  image_url: string | null;
  link: string | null;
  is_sotau: boolean;
  synced_at: string;
};

const LOCAL_IMAGES: Record<string, string> = {
  "Fight Nights": "/partner/fight-nights.png",
  "Fight Nights Event": "/partner/fight-nights.png",
  "Last Ship Standing": "/partner/last-ship-standing.png",
  "Emissaries of Fortune": "/partner/emissaries-of-fortune.png",
  "Festival of Giving": "/partner/festival-of-giving.png",
  "Festival of Giving Deadline": "/partner/festival-of-giving.png",
  "Renown Rally": "/partner/renown-rally.png",
  "Bilge Rats Weekender": "/partner/bilge-rats-weekender.png",
  "Twitch Drops": "/partner/twitch-drops.png",
  "Next SOTAU Community Event": "/partner/sotau-community.webp",
  "The Thinning Of The Veil": "/partner/festival-banner.jpg",
};

function imageSource(url: string | null, title: string) {
  if (LOCAL_IMAGES[title]) return LOCAL_IMAGES[title];
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://www.seaofthievesau.com/${url.replace(/^\//, "")}`;
}

export async function PartnerEvents({ limit = 6, compact = false }: { limit?: number; compact?: boolean }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("partner_events")
    .select("*")
    .gte("ends_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  const events = (data ?? []) as PartnerEvent[];

  return (
    <section aria-labelledby="partner-events-title" className={`partner-section${compact ? " partner-section--compact" : ""}`}>
      <Container>
        <div className="partner-heading">
          <div>
            <p className="partner-eyebrow">Partner community feed</p>
            <h2 id="partner-events-title" className="mt-2 text-2xl font-semibold text-content sm:text-3xl">
              Official in-game events &amp; SOTAU calendar
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-muted">
              Event data and artwork are synced from Sea of Thieves Australia (SOTAU), an official Affiliate Alliance community. Times remain in your selected regional timezone.
            </p>
          </div>
          <a href="https://www.seaofthievesau.com/events" target="_blank" rel="noopener noreferrer" className="partner-source">
            View partner source ↗
          </a>
        </div>

        {events.length === 0 ? (
          <p className="partner-empty">No partner events are currently published.</p>
        ) : (
          <div className="partner-grid">
            {events.map((event) => {
              const image = imageSource(event.image_url, event.title);
              return (
                <article key={event.external_id} className="partner-card">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${event.title} event artwork from SOTAU`}
                      width={640}
                      height={360}
                      loading="eager"
                      unoptimized
                    />
                  ) : null}
                  <div className="partner-card__body">
                    <div className="partner-card__meta">
                      <span>{event.is_sotau ? "SOTAU event" : (event.category_label ?? "In-game event")}</span>
                      <span>{formatDateTime(event.starts_at, "Asia/Singapore")}</span>
                    </div>
                    <h3>{event.title}</h3>
                    {event.description ? <p>{event.description}</p> : null}
                    <a
                      href={event.link || "https://www.seaofthievesau.com/events"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="partner-card__link"
                    >
                      Event details ↗
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="partner-credit">
          Source: Sea of Thieves Australia (SOTAU). SOTAU is an independent community and official member of the Sea of Thieves Affiliate Alliance; it is not operated by Rare Ltd. or Microsoft. Sea of Thieves is a trademark of Microsoft Corporation.
        </p>
      </Container>
    </section>
  );
}
