import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EVENT_TYPES } from "@/lib/content/site-config";
import { formatDateTime, timezoneLabel } from "@/lib/event/time";
import type { EventRecord } from "@/lib/event/types";

export function EventCard({ event }: { event: EventRecord }) {
  const typeLabel = EVENT_TYPES.find((type) => type.value === event.event_type)?.label ?? "Community event";

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-brand">{typeLabel}</p>
          <h3 className="mt-2 text-lg font-semibold text-content">{event.title}</h3>
        </div>
        <Badge tone="accent">{event.status}</Badge>
      </div>
      {event.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.image_url} alt={`${event.title} image`} className="media-card-cover mt-3" loading="lazy" />
      ) : null}
      <p className="mt-3 text-sm font-medium text-content">
        {formatDateTime(event.starts_at, event.timezone)}
      </p>
      <p className="text-xs text-content-muted">{timezoneLabel(event.timezone)}</p>
      {event.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-content-muted">{event.description}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-content-muted">
        {event.region ? <span>Region: {event.region}</span> : null}
        {event.platform ? <span>Platform: {event.platform}</span> : null}
      </div>
      <Link
        href={`/events/${event.id}`}
        className="mt-auto inline-flex min-h-11 items-center pt-5 text-sm font-semibold text-content underline decoration-border underline-offset-4 hover:decoration-brand"
      >
        View event →
      </Link>
    </Card>
  );
}
