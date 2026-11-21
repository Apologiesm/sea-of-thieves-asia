import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { RegionClock } from "@/components/content/RegionClock";
import { EventCountdown } from "@/components/event/EventCountdown";
import { getLiveSnapshot } from "@/lib/live/queries";
import { LocalTime } from "@/components/ui/local-time";
import {
  EVENT_FORMATS,
  LIVE_SEAS,
  QUICK_ACTIONS,
} from "@/lib/content/site-config";

function StatusDot({ live }: { live: boolean }) {
  return <span className={`live-dot${live ? " live-dot--on" : ""}`} aria-hidden="true" />;
}

export async function LiveSeas() {
  const { current, next, updates } = await getLiveSnapshot();

  return (
    <section aria-labelledby="live-seas-title" className="live-seas border-b border-border py-14 sm:py-20">
      <Container>
        <PageHeader eyebrow={LIVE_SEAS.eyebrow} title={LIVE_SEAS.title} description={LIVE_SEAS.description} />

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="live-board">
              <div className="live-board__top">
                <div>
                  <p className="live-board__eyebrow">{LIVE_SEAS.liveLabel}</p>
                  <h3 className="mt-2 text-xl font-semibold text-content sm:text-2xl">
                    {current ? current.title : LIVE_SEAS.noLive}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-content-muted">
                    {current ? (
                      <LocalTime iso={current.starts_at} timeZone={current.timezone} />
                    ) : (
                      LIVE_SEAS.noLiveDetail
                    )}
                  </p>
                </div>
                <StatusDot live={Boolean(current)} />
              </div>

              <div className="live-board__divider" aria-hidden="true" />

              <div className="mt-5">
                <p className="live-board__eyebrow">{LIVE_SEAS.nextLabel}</p>
                {next ? (
                  <>
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
                      <Link href={`/events/${next.id}`} className="text-base font-semibold text-content underline decoration-border underline-offset-4 hover:decoration-brand">
                        {next.title}
                      </Link>
                      <span className="text-xs text-content-muted">
                        <LocalTime iso={next.starts_at} timeZone={next.timezone} />
                      </span>
                    </div>
                    {next.starts_at ? (
                      <EventCountdown startsAt={next.starts_at} timeZone={next.timezone} />
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-content-muted" aria-label={`${LIVE_SEAS.nextLabel}: ${LIVE_SEAS.noNext}`}>
                    {LIVE_SEAS.noNext}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-card border border-border bg-surface/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-content">{LIVE_SEAS.updatesTitle}</p>
                  <p className="mt-1 text-xs leading-relaxed text-content-muted">{LIVE_SEAS.updatesDetail}</p>
                </div>
                <Link href="/announcements" className="min-h-11 inline-flex items-center text-sm text-content underline underline-offset-4">
                  All news →
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {updates.length === 0 ? (
                  <p className="text-sm text-content-muted">
                    {LIVE_SEAS.noUpdates}
                  </p>
                ) : (
                  updates.map((update) => (
                    <Link
                      key={update.id}
                      href={`/announcements/${update.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border px-4 py-3 hover:border-brand"
                    >
                      <span className="text-sm text-content">{update.title}</span>
                      <span className="text-xs text-content-muted">{update.category ?? "News"}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="live-side">
              <RegionClock />
              <div className="mt-6">
                <p className="text-sm font-semibold text-content">{LIVE_SEAS.formatsTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-content-muted">{LIVE_SEAS.formatsDetail}</p>
                <ul className="mt-4 grid gap-2">
                  {EVENT_FORMATS.map((format) => (
                    <li key={format.key} className="format-row">
                      <span className="format-row__label">{format.label}</span>
                      <span className="format-row__note">{format.note}</span>
                      <span className="format-row__time">{format.timing}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) =>
                  action.external ? (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="quick-action"
                    >
                      {action.label} ↗
                    </a>
                  ) : (
                    <Link key={action.label} href={action.href} className="quick-action">
                      {action.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
