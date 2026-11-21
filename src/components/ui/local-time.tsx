"use client";

import { useTimeZone } from "@/components/system/time-zone-provider";
import {
  DATETIME_OPTIONS,
  formatInTimeZone,
  timeZoneLabel,
} from "@/lib/time/zone";

type Props = {
  /** UTC ISO timestamp from the database. */
  iso: string | null;
  /** The timezone the host published the event in (kept for reference). */
  timeZone?: string | null;
  /** Optional end timestamp; when present the output becomes a range. */
  endIso?: string | null;
  /** Show the zone label after the time. */
  showZone?: boolean;
  className?: string;
};

/**
 * Renders a timestamp in the visitor's chosen display zone (UTC by default).
 * Server and first client render agree because both start from the stored
 * preference, so there is no hydration mismatch when the visitor changes zone.
 */
export function LocalTime({ iso, endIso, timeZone, showZone = false, className }: Props) {
  const { timeZone: viewerZone } = useTimeZone();

  const start = formatInTimeZone(iso, viewerZone, DATETIME_OPTIONS);
  const end = endIso ? formatInTimeZone(endIso, viewerZone, DATETIME_OPTIONS) : null;
  const published = timeZone ? formatInTimeZone(iso, timeZone, DATETIME_OPTIONS) : null;

  return (
    <span
      className={className}
      title={
        published
          ? `Published as ${published} (${timeZoneLabel(timeZone)}). Showing ${timeZoneLabel(viewerZone)}.`
          : `Showing ${timeZoneLabel(viewerZone)}.`
      }
    >
      {end ? `${start} – ${end}` : start}
      {showZone ? <span className="text-content-muted"> · {timeZoneLabel(viewerZone)}</span> : null}
    </span>
  );
}
