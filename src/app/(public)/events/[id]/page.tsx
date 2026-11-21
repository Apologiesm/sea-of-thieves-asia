import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EventStatusControl } from "@/components/event/EventStatusControl";
import { RsvpControl } from "@/components/event/RsvpControl";
import { getEvent, getMyRsvp, getRsvpCounts } from "@/lib/event/queries";
import { timezoneLabel } from "@/lib/event/time";
import { LocalTime } from "@/components/ui/local-time";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPES, EVENT_PRIVACY_NOTICE } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Event detail" };

type Props = { params: Promise<{ id: string }> };

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <dt className="text-xs uppercase tracking-[0.14em] text-content-muted">{label}</dt>
      <dd className="mt-1 text-sm text-content">{value}</dd>
    </div>
  );
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [counts, myRsvp] = await Promise.all([getRsvpCounts(id), getMyRsvp(id)]);
  const supabase = await createClient();
  let isOwner = false;
  let isModerator = false;
  let signedIn = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    isOwner = Boolean(user && event.created_by === user.id);
    if (user) {
      const { data } = await supabase.rpc("is_moderator");
      isModerator = Boolean(data);
    }
  }

  const typeLabel = EVENT_TYPES.find((type) => type.value === event.event_type)?.label ?? "Community event";
  const discordUrl = event.discord_event_url?.startsWith("https://discord.com/events/")
    ? event.discord_event_url
    : null;

  return (
    <>
      <PageHeader eyebrow={typeLabel} title={event.title} description={event.description ?? "No description provided."} />
      <Container>
        <div className="grid gap-8 py-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="accent">{event.status}</Badge>
                <span className="text-xs text-content-muted">{timezoneLabel(event.timezone)}</span>
              </div>
              <dl className="mt-4">
                <Row
                  label="When"
                  value={<LocalTime iso={event.starts_at} endIso={event.ends_at} timeZone={event.timezone} />}
                />
                <Row label="Region" value={event.region} />
                <Row label="Platform" value={event.platform} />
                <Row label="Location / channel" value={event.location} />
                <Row label="Max attendees" value={event.max_attendees ? String(event.max_attendees) : null} />
              </dl>
              <div className="mt-6 rounded-lg border border-border bg-surface-raised/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">RSVP summary</p>
                <p className="mt-2 text-sm text-content">
                  Going {counts.going} · Maybe {counts.maybe} · Can&apos;t go {counts.cant_go}
                </p>
              </div>
              <div className="mt-6">
                {discordUrl ? (
                  <a
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-canvas"
                  >
                    Open Discord event
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label="Discord event link: Coming soon"
                    className="inline-flex min-h-11 cursor-not-allowed items-center rounded-lg border border-border px-5 py-2.5 text-sm text-content-muted opacity-70"
                  >
                    Discord event link · Coming soon
                  </button>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card>
              <h2 className="text-base font-semibold text-content">Your RSVP</h2>
              <p className="mt-2 text-sm text-content-muted">
                {signedIn ? "Choose your response. Only you can change your RSVP." : "Sign in to RSVP."}
              </p>
              <div className="mt-5">
                {signedIn && event.status === "published" ? (
                  <RsvpControl eventId={id} initial={myRsvp} />
                ) : (
                  <Link href="/login" className="inline-flex min-h-11 items-center text-sm text-content underline underline-offset-4">
                    Sign in with Discord
                  </Link>
                )}
              </div>
            </Card>

            {isOwner || isModerator ? (
              <Card className="mt-6">
                <h2 className="text-base font-semibold text-content">Event management</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/events/${id}/edit`} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas">
                    Edit event
                  </Link>
                  {isModerator ? <EventStatusControl eventId={id} current={event.status} /> : null}
                </div>
              </Card>
            ) : null}

            <p className="mt-6 text-xs leading-relaxed text-content-muted">{EVENT_PRIVACY_NOTICE}</p>
          </div>
        </div>
      </Container>
    </>
  );
}
