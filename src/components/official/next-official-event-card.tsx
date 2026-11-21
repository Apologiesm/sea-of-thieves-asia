"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTimeZone } from "@/components/system/time-zone-provider";
import { countdownParts, occurrenceState, type Occurrence } from "@/lib/official/schedule";
import {
  DATETIME_OPTIONS,
  formatInTimeZone,
  timeZoneLabel,
} from "@/lib/time/zone";
import type { NextOfficialEventView } from "@/lib/official/event-queries";

type Props = { view: NextOfficialEventView };

function Countdown({ targetIso, label }: { targetIso: string; label: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Deferred once so the server HTML (dashes) and the first client render
    // agree, then tick on the second.
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const parts = now === null ? null : countdownParts(targetIso, new Date(now));
  const cells: { value: string; label: string }[] = [
    { value: parts?.display.days ?? "--", label: "Days" },
    { value: parts?.display.hours ?? "--", label: "Hours" },
    { value: parts?.display.minutes ?? "--", label: "Minutes" },
    { value: parts?.display.seconds ?? "--", label: "Seconds" },
  ];

  return (
    <div className="official-next__countdown" role="timer" aria-label={label}>
      {cells.map((cell) => (
        <div key={cell.label} className="official-next__cell">
          <span className="official-next__digits">{cell.value}</span>
          <span className="official-next__unit">{cell.label}</span>
        </div>
      ))}
    </div>
  );
}

export function NextOfficialEventCard({ view }: Props) {
  const { timeZone } = useTimeZone();
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const target: Occurrence | null = view.live ?? view.next;
  const current = now === null ? null : new Date(now);
  const localState = target && current ? occurrenceState(target, current) : null;

  // When the countdown finishes, or a live event ends, ask the server once for
  // the refreshed schedule instead of polling the database.
  useEffect(() => {
    if (refreshed.current || !localState) return;
    if (localState === "completed") {
      refreshed.current = true;
      router.refresh();
    }
  }, [localState, router]);

  if (view.state === "none" || !target) {
    return (
      <section className="official-next official-next--empty" aria-labelledby="official-next-title">
        <div className="official-next__frame">
          <div className="official-next__body">
            <p className="official-next__eyebrow">Official Sea of Thieves</p>
            <h2 id="official-next-title" className="official-next__title">
              Next official event not yet announced
            </h2>
            <p className="official-next__description">
              Rare has not published a dated or recurring event we can verify. Nothing is invented
              here — when the official Event Hub publishes the next one, it appears in this space and
              starts counting down on its own.
            </p>
            <a className="official-next__link" href={view.hubUrl} rel="noreferrer noopener" target="_blank">
              Check the official Event Hub
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Trust the server until the first tick, so a running event never flashes
  // "Next official event" before the client takes over.
  const live = localState ? localState === "live" : view.state === "live";
  const startingSoon = localState === "starting_soon";
  const endsAt = target.endsAt;
  const countdownTarget = live ? endsAt : target.startsAt;

  const zone = timeZoneLabel(timeZone);
  const startsText = formatInTimeZone(target.startsAt, timeZone, DATETIME_OPTIONS);
  const endsText = endsAt ? formatInTimeZone(endsAt, timeZone, DATETIME_OPTIONS) : null;

  const badge = live ? "Live now" : startingSoon ? "Starting soon" : "Next official event";

  return (
    <section
      className={`official-next${live ? " official-next--live" : ""}`}
      aria-labelledby="official-next-title"
    >
      <div className="official-next__frame">
        <div className="official-next__media">
          {target.artworkUrl ? (
            // Artwork comes from the official site, so it is a plain <img>
            // rather than a Next image optimiser round trip.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={target.artworkUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <div className="official-next__media-fallback" aria-hidden="true">
              <span>Sea of Thieves</span>
            </div>
          )}
          <span className="official-next__badge">{badge}</span>
        </div>

        <div className="official-next__body">
          <p className="official-next__eyebrow">
            Official Sea of Thieves
            {target.category ? <span className="official-next__category">{target.category}</span> : null}
            {view.flag && !live ? <span className="official-next__flag">{view.flag}</span> : null}
          </p>

          <h2 id="official-next-title" className="official-next__title">
            {target.name}
          </h2>

          {target.featuredShip ? (
            <p className="official-next__ship">Featured ship: {target.featuredShip}</p>
          ) : null}

          {target.description ? (
            <p className="official-next__description">{target.description}</p>
          ) : null}

          <div className="official-next__times">
            <div className="official-next__time">
              <span className="official-next__time-label">Starts</span>
              <span className="official-next__time-value">{startsText}</span>
            </div>
            <div className="official-next__time">
              <span className="official-next__time-label">Ends</span>
              <span className="official-next__time-value">
                {endsText ?? "End time not published"}
              </span>
            </div>
            <div className="official-next__time">
              <span className="official-next__time-label">Your time zone</span>
              <span className="official-next__time-value">{zone}</span>
            </div>
          </div>

          {target.scheduleNote ? (
            <p className="official-next__schedule">
              Official schedule: <span>{target.scheduleNote}</span>
            </p>
          ) : null}

          {countdownTarget ? (
            <Countdown
              targetIso={countdownTarget}
              label={live ? `${target.name} ends in` : `${target.name} starts in`}
            />
          ) : (
            <p className="official-next__inprogress">
              Running now — the official schedule lists no end time.
            </p>
          )}

          <div className="official-next__footer">
            <a
              className="official-next__link"
              href={target.sourceUrl ?? view.hubUrl}
              rel="noreferrer noopener"
              target="_blank"
            >
              Official event page
            </a>
            <span className="official-next__source">
              Source: seaofthieves.com/event-hub
              {view.checkedLabel ? ` · ${view.checkedLabel}` : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
