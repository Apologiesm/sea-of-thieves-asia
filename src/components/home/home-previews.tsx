import Link from "next/link";
import { PreviewSection } from "@/components/sections/preview-section";
import { LocalTime } from "@/components/ui/local-time";
import { EVENT_TYPES, type PreviewConfig } from "@/lib/content/site-config";
import { listEvents } from "@/lib/event/queries";
import { listCrewListings } from "@/lib/crew/queries";
import { listGallery, listGuides } from "@/lib/m8/queries";
import { eventFiltersSchema } from "@/lib/event/validation";
import { crewFiltersSchema } from "@/lib/crew/validation";
import type { EventRecord } from "@/lib/event/types";
import type { CrewListing } from "@/lib/crew/types";

function eventTypeLabel(event: EventRecord) {
  return EVENT_TYPES.find((type) => type.value === event.event_type)?.label ?? "Community event";
}

function seatLabel(listing: CrewListing) {
  const open = Math.max(listing.seats_total - listing.seats_filled, 0);
  return `${open} of ${listing.seats_total} seats open`;
}

/**
 * The homepage previews render live rows from Supabase. Each one only shows
 * content that is actually public right now, and falls back to the section's
 * honest empty state when the community has nothing to show yet.
 */
export async function HomePreviews({ previews }: { previews: readonly PreviewConfig[] }) {
  const [events, crews, gallery, guides] = await Promise.all([
    listEvents(eventFiltersSchema.parse({ status: "published", when: "upcoming" })),
    listCrewListings(crewFiltersSchema.parse({})),
    listGallery("approved"),
    listGuides({ q: "", category: "", tag: "", author: "" }),
  ]);

  const upcoming = events.slice(0, 3);
  const activeCrews = crews.slice(0, 3);
  const shots = gallery.slice(0, 6);
  const publishedGuides = guides.slice(0, 3);

  const content: Record<string, React.ReactNode> = {
    events: upcoming.length ? (
      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface/40">
        {upcoming.map((event) => (
          <li key={event.id}>
            <Link
              href={`/events/${event.id}`}
              className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-surface/70 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-[0.18em] text-brand">
                  {eventTypeLabel(event)}
                </span>
                <span className="mt-1 block truncate text-base font-semibold text-content">
                  {event.title}
                </span>
                <span className="mt-1 block text-xs text-content-muted">
                  <LocalTime iso={event.starts_at} timeZone={event.timezone} />
                  {event.region ? ` · ${event.region}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs text-content-muted">
                {event.max_attendees ? `${event.max_attendees} places` : "Open to all"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : null,

    crewListings: activeCrews.length ? (
      <ul className="grid gap-3">
        {activeCrews.map((listing) => (
          <li key={listing.id}>
            <Link
              href={`/crew/${listing.id}`}
              className="block rounded-card border border-border bg-surface/40 px-5 py-4 transition-colors hover:bg-surface/70"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base font-semibold text-content">{listing.title}</span>
                <span className="text-xs text-content-muted">{seatLabel(listing)}</span>
              </span>
              <span className="mt-1 block text-xs text-content-muted">
                {[
                  listing.playstyle,
                  listing.region,
                  (listing.languages ?? []).slice(0, 3).join(", "),
                  listing.availability,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : null,

    gallery: shots.length ? (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shots.map((item) => (
          <li key={item.id}>
            <Link
              href={`/gallery/${item.id}`}
              className="group block overflow-hidden rounded-card border border-border bg-surface"
            >
              <span className="relative block aspect-video overflow-hidden bg-canvas">
                {item.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.publicUrl}
                    alt={item.alt_text ?? item.caption ?? "Community gallery image"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : null,

    guides: publishedGuides.length ? (
      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface/40">
        {publishedGuides.map((guide) => (
          <li key={guide.id}>
            <Link
              href={`/guides/${guide.id}`}
              className="block px-5 py-4 transition-colors hover:bg-surface/70"
            >
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand">
                {guide.category ?? "Guide"}
              </span>
              <span className="mt-1 block text-base font-semibold text-content">{guide.title}</span>
              {guide.excerpt ? (
                <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-content-muted">
                  {guide.excerpt}
                </span>
              ) : null}
              <span className="mt-1 block text-[11px] text-content-muted">
                {guide.reading_minutes} min read
                {guide.author_name ? ` · ${guide.author_name}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : null,
  };

  return (
    <div id="sections">
      {previews.map((preview, index) => (
        <PreviewSection key={preview.key} preview={preview} index={index}>
          {content[preview.key] ?? null}
        </PreviewSection>
      ))}
    </div>
  );
}

