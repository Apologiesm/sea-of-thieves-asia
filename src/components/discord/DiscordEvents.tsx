import Link from "next/link";
import { Container } from "@/components/ui/container";
import { TiltCard } from "@/components/ui/TiltCard";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/event/time";
import { DISCORD_EVENTS } from "@/lib/content/site-config";

type DiscordEvent = {
  external_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  event_url: string | null;
};

export async function DiscordEvents({ limit = 6 }: { limit?: number }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("discord_events")
    .select("*")
    .or(`starts_at.gte.${now},ends_at.gte.${now}`)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  const events = (data ?? []) as DiscordEvent[];

  return (
    <section aria-labelledby="discord-events-title" className="partner-section">
      <Container>
        <div className="partner-heading">
          <div>
            <p className="partner-eyebrow">{DISCORD_EVENTS.eyebrow}</p>
            <h2 id="discord-events-title" className="mt-2 text-2xl font-semibold text-content sm:text-3xl">
              {DISCORD_EVENTS.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-muted">
              {DISCORD_EVENTS.description}
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="partner-empty">{DISCORD_EVENTS.empty}</p>
        ) : (
          <div className="partner-grid">
            {events.map((event) => (
              <TiltCard key={event.external_id}>
                <article className="partner-card">
                  {event.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.image_url}
                      alt={`${event.title} event artwork`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <div className="partner-card__body">
                    <div className="partner-card__meta">
                      <span>Live event</span>
                      <span>{formatDateTime(event.starts_at, "Asia/Singapore")}</span>
                    </div>
                    <h3>{event.title}</h3>
                    {event.description ? <p>{event.description}</p> : null}
                    {event.event_url ? (
                      <Link href={event.event_url} className="partner-card__link" target="_blank" rel="noopener noreferrer">
                        Event details ↗
                      </Link>
                    ) : null}
                  </div>
                </article>
              </TiltCard>
            ))}
          </div>
        )}

        <p className="partner-credit">{DISCORD_EVENTS.credit}</p>
      </Container>
    </section>
  );
}
