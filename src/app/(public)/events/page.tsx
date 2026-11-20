import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { EventCard } from "@/components/event/EventCard";
import { EventCalendar } from "@/components/event/EventCalendar";
import { EventCountdown } from "@/components/event/EventCountdown";
import { EventFilters } from "@/components/event/EventFilters";
import { getNextEvent, listEvents } from "@/lib/event/queries";
import { eventFiltersSchema } from "@/lib/event/validation";
import { createClient } from "@/lib/supabase/server";
import { EVENT_PRIVACY_NOTICE } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Events", description: "Community events and voyages." };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = eventFiltersSchema.safeParse({
    q: one(params.q), region: one(params.region), platform: one(params.platform),
    language: one(params.language), playstyle: one(params.playstyle),
    shipPreference: one(params.shipPreference), rolePreference: one(params.rolePreference),
    availability: one(params.availability), date: one(params.date), status: one(params.status) || "published",
  });
  const values = filters.success ? filters.data : eventFiltersSchema.parse({});
  const events = await listEvents(values);
  const view = one(params.view) === "calendar" ? "calendar" : "list";
  const month = /^\d{4}-\d{2}$/.test(one(params.month)) ? one(params.month) : currentMonth();

  const next = getNextEvent(events);

  let canManage = false;
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc("is_event_host");
      canManage = Boolean(data);
    }
  }

  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) query.set(key, String(value));
  });

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Community events"
        description="Fleet nights, tournaments, treasure hunts and more — published by real hosts."
      />
      <Container>
        <div className="py-10 sm:py-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-content-muted">{events.length} published {events.length === 1 ? "event" : "events"}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/events?${query.toString()}`} className={view === "list" ? "view-toggle view-toggle--active" : "view-toggle"}>List</Link>
              <Link href={`/events?${query.toString()}&view=calendar&month=${month}`} className={view === "calendar" ? "view-toggle view-toggle--active" : "view-toggle"}>Calendar</Link>
              {canManage ? (
                <>
                  <ButtonLink href="/events/new">Create event</ButtonLink>
                  <ButtonLink href="/events/manage" variant="secondary">Manage events</ButtonLink>
                </>
              ) : null}
            </div>
          </div>

          {next && next.starts_at ? (
            <div className="next-event-strip">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand">Next event</p>
                <Link href={`/events/${next.id}`} className="mt-1 block text-lg font-semibold text-content hover:underline">{next.title}</Link>
              </div>
              <EventCountdown startsAt={next.starts_at} timeZone={next.timezone} />
            </div>
          ) : null}

          <EventFilters filters={values} />

          <div className="mt-8">
            {events.length === 0 ? (
              <EmptyState
                title="No events scheduled yet"
                description="No events have been published yet. Hosts will add real voyages here."
              />
            ) : view === "calendar" ? (
              <EventCalendar events={events} month={month} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            )}
          </div>

          <div className="mt-10 rounded-card border border-border bg-surface/40 p-5">
            <h2 className="text-sm font-semibold text-content">Privacy notice</h2>
            <p className="mt-2 text-sm leading-relaxed text-content-muted">{EVENT_PRIVACY_NOTICE}</p>
          </div>
        </div>
      </Container>
    </>
  );
}
