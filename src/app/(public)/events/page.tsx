import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { EventCard } from "@/components/event/EventCard";
import { EventFilters } from "@/components/event/EventFilters";
import { listEvents } from "@/lib/event/queries";
import { eventFiltersSchema } from "@/lib/event/validation";
import { createClient } from "@/lib/supabase/server";
import { EVENT_PRIVACY_NOTICE } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Events", description: "Community events and voyages." };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function flatten(params: Record<string, string | string[] | undefined>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }
  return result;
}

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const parsed = eventFiltersSchema.safeParse(flatten(await searchParams));
  const filters = parsed.success ? parsed.data : eventFiltersSchema.parse({});
  const events = await listEvents(filters);

  let canManage = false;
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc("is_event_host");
      canManage = Boolean(data);
    }
  }

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
            {canManage ? (
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/events/new">Create event</ButtonLink>
                <ButtonLink href="/events/manage" variant="secondary">Manage events</ButtonLink>
              </div>
            ) : null}
          </div>

          <EventFilters filters={filters} />

          <div className="mt-8">
            {events.length === 0 ? (
              <EmptyState
                title="No events scheduled yet"
                description="Events are empty for beta. Hosts will publish real voyages here."
              />
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
