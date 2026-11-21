/**
 * Compatibility layer over the shared time system in `@/lib/time/zone`.
 *
 * Older components import from here. Keep them working, but do not add new
 * time logic to this file — everything belongs in `lib/time/zone.ts`.
 */
import {
  DATETIME_OPTIONS,
  TIME_OPTIONS,
  convertLocalInputToUtc,
  formatInTimeZone,
  getTimeZoneOffsetLabel,
  timeZoneLabel as zoneLabel,
  utcToLocalInput,
} from "@/lib/time/zone";

export function formatDateTime(iso: string | null, timeZone: string | null): string {
  return formatInTimeZone(iso, timeZone, DATETIME_OPTIONS);
}

export function formatTimeRange(
  start: string | null,
  end: string | null,
  timeZone: string | null,
): string {
  if (!start) return "Time to be announced";
  const begin = formatInTimeZone(start, timeZone, DATETIME_OPTIONS);
  if (!end) return begin;
  return `${begin} – ${formatInTimeZone(end, timeZone, DATETIME_OPTIONS)}`;
}

export function timezoneLabel(timeZone: string | null): string {
  return zoneLabel(timeZone);
}

export function timezoneOffset(timeZone: string | null): string {
  return getTimeZoneOffsetLabel(timeZone);
}

/** YYYY-MM-DD key in the given zone, for calendar grouping. */
export function eventDateKey(iso: string | null, timeZone: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
}

export function formatTimeOnly(iso: string | null, timeZone: string | null): string {
  return formatInTimeZone(iso, timeZone, TIME_OPTIONS);
}

export const zonedDateTimeToIso = convertLocalInputToUtc;
export const isoToZonedLocal = utcToLocalInput;
