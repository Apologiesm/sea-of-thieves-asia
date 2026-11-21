"use client";

import { useEffect, useRef, useState } from "react";
import { useTimeZone } from "@/components/system/time-zone-provider";
import {
  TIME_ZONE_OPTIONS,
  formatClock,
  getTimeZoneOffsetLabel,
  timeZoneLabel,
} from "@/lib/time/zone";

type Snapshot = { time: string; date: string; offset: string };

/**
 * Live regional clock.
 *
 * - Reads the visitor's stored zone from the shared timezone context (UTC by
 *   default), never the browser's own zone.
 * - Ticks once per second, no network requests.
 * - Recomputes immediately when the selection changes.
 */
export function RegionClock({ id = "region-clock" }: { id?: string }) {
  const { timeZone, setTimeZone } = useTimeZone();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    tickRef.current = () => {
      const now = new Date();
      const { time, date } = formatClock(now, timeZone);
      setSnapshot({ time, date, offset: getTimeZoneOffsetLabel(timeZone, now) });
    };

    // A timeout (not rAF) so the first real time appears even in a tab the
    // browser is throttling; the deferred call also avoids a hydration cascade.
    const first = window.setTimeout(() => tickRef.current(), 0);
    const timer = window.setInterval(() => tickRef.current(), 1000);

    // Recover immediately when a suspended tab becomes visible again.
    const onVisible = () => {
      if (document.visibilityState === "visible") tickRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [timeZone]);

  return (
    <div className="region-clock">
      <div className="region-clock__head">
        <p className="region-clock__eyebrow">Regional time</p>
        <label className="sr-only" htmlFor={`${id}-zone`}>
          Display time zone
        </label>
        <select
          id={`${id}-zone`}
          className="region-clock__select"
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
        >
          {TIME_ZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({getTimeZoneOffsetLabel(option.value)})
            </option>
          ))}
        </select>
      </div>

      <div className="region-clock__readout">
        <time
          className="region-clock__time"
          aria-live="off"
          dateTime={snapshot?.time}
        >
          {snapshot ? snapshot.time : <span className="region-clock__pending" aria-hidden="true" />}
        </time>
        <span className="region-clock__meta">
          <span className="region-clock__date">{snapshot ? snapshot.date : "\u00a0"}</span>
          <span className="region-clock__zone">
            {timeZoneLabel(timeZone)} · {snapshot?.offset ?? getTimeZoneOffsetLabel(timeZone)}
          </span>
        </span>
      </div>
      <p className="region-clock__note">
        Your choice is remembered on this device and on your profile when signed in.
      </p>
    </div>
  );
}
