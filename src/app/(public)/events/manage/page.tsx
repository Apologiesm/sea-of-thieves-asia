import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EventFilters } from "@/components/event/EventFilters";
import { EventStatusControl } from "@/components/event/EventStatusControl";
import { listEvents } from "@/lib/event/queries";
import { eventFiltersSchema } from "@/lib/event/validation";
import { formatDateTime } from "@/lib/event/time";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Manage events" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function flatten(params: Record<string, string | string[] | undefined>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }
  return result;
}

export default async function ManageEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const parsed = eventFiltersSchema.safeParse(flatten(await searchParams));
  const filters = parsed.success ? parsed.data : eventFiltersSchema.parse({ status: "all" });
  const effective = { ...filters, status: filters.status || "all" };

  const supabase = await createClient();
  let allowed = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc("is_event_host");
      allowed = Boolean(data);
    }
  }

  const events = allowed ? await listEvents(effective, true) : [];

  return (
    <>
      <PageHeader eyebrow="Management" title="Event management" description="Create, edit and change event status. Authorized hosts and moderators only." />
      <Container>
        <div className="py-10 sm:py-14">
          {!allowed ? (
            <Card>
              <p className="text-sm text-content-muted">You do not have event management access.</p>
            </Card>
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-content-muted">{events.length} events</p>
                <ButtonLink href="/events/new">Create event</ButtonLink>
              </div>
              <EventFilters filters={effective} includeStatus />
              <div className="mt-8 grid gap-4">
                {events.length === 0 ? (
                  <Card><p className="text-sm text-content-muted">No events match these filters.</p></Card>
                ) : (
                  events.map((event) => (
                    <Card key={event.id}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-content">{event.title}</p>
                          <p className="mt-1 text-xs text-content-muted">
                            {formatDateTime(event.starts_at, event.timezone)} · {event.status}
                          </p>
                        </div>
                        <Link href={`/events/${event.id}`} className="min-h-11 inline-flex items-center text-sm text-content underline underline-offset-4">
                          View
                        </Link>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <Link href={`/events/${event.id}/edit`} className="min-h-11 inline-flex items-center rounded-lg border border-border px-4 text-sm text-content hover:border-brand">
                          Edit
                        </Link>
                        <EventStatusControl eventId={event.id} current={event.status} />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </Container>
    </>
  );
}
