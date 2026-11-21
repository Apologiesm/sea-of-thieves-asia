"use client";

import { useEffect, useState } from "react";
import {
  DATETIME_OPTIONS,
  DEFAULT_TIME_ZONE,
  formatInZone,
} from "@/lib/time/format";

type Props = {
  /** UTC ISO timestamp from the database. */
  iso: string | null;
  /** The timezone the event or listing was published in. */
  timeZone: string | null;
  /** Optional end timestamp; when present the output becomes a range. */
  endIso?: string | null;
  /** Label appended once the visitor's own clock is used. */
  suffix?: string;
  className?: string;
};

/**
 * Shows a timestamp in the timezone the host published it in during server
 * render, then switches to the visitor's own clock once hydrated.
 *
 * The first client render intentionally matches the server output, so there is
 * no hydration mismatch; the swap happens in an effect. The `title` keeps the
 * published time reachable for anyone comparing schedules.
 */
export function LocalTime({ iso, timeZone, endIso, suffix = "your time", className }: Props) {
  const published = formatInZone(iso, timeZone, DATETIME_OPTIONS);
  const publishedEnd = endIso ? formatInZone(endIso, timeZone, DATETIME_OPTIONS) : null;

  const [local, setLocal] = useState<{ main: string; end: string | null } | null>(null);

  useEffect(() => {
    // Deferred to the next frame so the effect never triggers a cascading
    // render during hydration; the server-rendered time stays on screen until
    // the browser's own timezone is known.
    const frame = requestAnimationFrame(() => {
      let zone: string | null = null;
      try {
        zone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      } catch {
        zone = null;
      }
      if (!zone || zone === (timeZone ?? DEFAULT_TIME_ZONE)) return;
      const main = formatInZone(iso, zone, DATETIME_OPTIONS);
      const end = endIso ? formatInZone(endIso, zone, DATETIME_OPTIONS) : null;
      // Identical clock time in a different zone needs no second label.
      if (main === published && end === publishedEnd) return;
      setLocal({ main, end });
    });
    return () => cancelAnimationFrame(frame);
  }, [iso, endIso, timeZone]);

  const main = local?.main ?? published;
  const end = local ? local.end : publishedEnd;
  const publishedRange = publishedEnd ? `${published} – ${publishedEnd}` : published;

  return (
    <span
      className={className}
      title={`Published as ${publishedRange} (${timeZone ?? DEFAULT_TIME_ZONE})`}
    >
      {end ? `${main} – ${end}` : main}
      {local ? <span className="text-content-muted"> · {suffix}</span> : null}
    </span>
  );
}
