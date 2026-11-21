/**
 * One time system for the whole site.
 *
 * Rules that must not be broken:
 * - UTC is the default for every visitor. The browser's own zone is never
 *   silently applied.
 * - Every stored timestamp is UTC; conversion happens at the edges only.
 * - Formatting always goes through Intl so daylight-saving rules stay correct.
 *   No offsets are hardcoded anywhere.
 */

export const DEFAULT_TIME_ZONE = "UTC";

export const TIME_ZONE_COOKIE = "sot_tz";

export type TimeZoneOption = {
  /** IANA identifier used by Intl and the database. */
  value: string;
  /** Human label shown in the interface. */
  label: string;
  /** Short region hint. */
  region: string;
};

/** The only zones offered in the picker, UTC first. */
export const TIME_ZONE_OPTIONS: readonly TimeZoneOption[] = [
  { value: "UTC", label: "UTC", region: "Coordinated Universal Time" },
  { value: "Asia/Singapore", label: "Singapore", region: "Singapore" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", region: "Malaysia" },
  { value: "Asia/Bangkok", label: "Bangkok", region: "Thailand" },
  { value: "Asia/Jakarta", label: "Jakarta", region: "Indonesia" },
  { value: "Asia/Manila", label: "Manila", region: "Philippines" },
  { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh City", region: "Vietnam" },
  { value: "Asia/Shanghai", label: "Shanghai", region: "China" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", region: "Hong Kong" },
  { value: "Asia/Taipei", label: "Taipei", region: "Taiwan" },
  { value: "Asia/Seoul", label: "Seoul", region: "South Korea" },
  { value: "Asia/Tokyo", label: "Tokyo", region: "Japan" },
  { value: "Asia/Kolkata", label: "Kolkata", region: "India" },
  { value: "Asia/Dubai", label: "Dubai", region: "United Arab Emirates" },
] as const;

const ZONE_VALUES = new Set(TIME_ZONE_OPTIONS.map((option) => option.value));

export function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!ZONE_VALUES.has(value)) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Coerce anything (cookie, profile row, URL param) into a supported zone. */
export function resolveTimeZone(value: string | null | undefined): string {
  return isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE;
}

export function timeZoneLabel(value: string | null | undefined): string {
  const zone = resolveTimeZone(value);
  return TIME_ZONE_OPTIONS.find((option) => option.value === zone)?.label ?? zone;
}

/** "UTC+08:00" style label for a zone at a specific instant. */
export function getTimeZoneOffsetLabel(
  value: string | null | undefined,
  at: Date = new Date(),
): string {
  const zone = resolveTimeZone(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!parts) return "UTC+00:00";
  if (parts === "GMT" || parts === "UTC") return "UTC+00:00";
  // "GMT+08:00" -> "UTC+08:00"
  return parts.replace(/^GMT/, "UTC");
}

/** Minute precision, e.g. "24 Nov 2026, 18:30". */
export const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

export const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export const CLOCK_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

export function formatInTimeZone(
  iso: string | null,
  timeZone: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  fallbackText = "Time to be announced",
): string {
  if (!iso) return fallbackText;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallbackText;
  const zone = resolveTimeZone(timeZone);
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: zone, ...options }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", { timeZone: DEFAULT_TIME_ZONE, ...options }).format(date);
  }
}

export function formatTimeInZone(iso: string | null, timeZone: string | null | undefined): string {
  return formatInTimeZone(iso, timeZone, TIME_OPTIONS);
}

export function formatDateInZone(iso: string | null, timeZone: string | null | undefined): string {
  return formatInTimeZone(iso, timeZone, DATE_OPTIONS);
}

/** Full local clock for a zone: date plus seconds. */
export function formatClock(
  date: Date,
  timeZone: string | null | undefined,
): { time: string; date: string } {
  const zone = resolveTimeZone(timeZone);
  try {
    return {
      time: new Intl.DateTimeFormat("en-GB", { timeZone: zone, ...CLOCK_OPTIONS }).format(date),
      date: new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date),
    };
  } catch {
    return {
      time: new Intl.DateTimeFormat("en-GB", { timeZone: DEFAULT_TIME_ZONE, ...CLOCK_OPTIONS }).format(date),
      date: new Intl.DateTimeFormat("en-GB", {
        timeZone: DEFAULT_TIME_ZONE,
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date),
    };
  }
}

type ZoneParts = Record<string, string>;

function partsInZone(date: Date, timeZone: string): ZoneParts {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const result: ZoneParts = {};
  formatted.forEach((part) => {
    if (part.type !== "literal") result[part.type] = part.value;
  });
  return result;
}

/**
 * Convert a wall-clock value from a datetime-local input in `timeZone` into a
 * UTC ISO timestamp. This is the only place that performs the conversion.
 */
export function convertLocalInputToUtc(
  local: string,
  timeZone: string | null | undefined,
): string | null {
  if (!local) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match.map(Number);
  const zone = resolveTimeZone(timeZone);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  try {
    const parts = partsInZone(new Date(guess), zone);
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    return new Date(guess - (asUtc - guess)).toISOString();
  } catch {
    return new Date(guess).toISOString();
  }
}

/** Inverse of `convertLocalInputToUtc`, for prefilling edit forms. */
export function utcToLocalInput(
  iso: string | null,
  timeZone: string | null | undefined,
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    const parts = partsInZone(date, resolveTimeZone(timeZone));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  } catch {
    return iso.slice(0, 16);
  }
}

// ---------------------------------------------------------------------------
// Event status
// ---------------------------------------------------------------------------

export type StoredEventStatus = "draft" | "published" | "cancelled" | "completed" | string;

export type ComparableEvent = {
  status: StoredEventStatus;
  starts_at: string | null;
  ends_at?: string | null;
};

export type EventLifecycle = "draft" | "scheduled" | "live" | "completed" | "cancelled" | "archived";

/** Events without an end time are treated as open for this long. */
export const DEFAULT_EVENT_DURATION_MS = 4 * 60 * 60 * 1000;

/** Completed events move to the archive after this long. */
export const ARCHIVE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export function getEventWindow(event: ComparableEvent): { start: number; end: number } | null {
  if (!event.starts_at) return null;
  const start = new Date(event.starts_at).getTime();
  if (Number.isNaN(start)) return null;
  const parsedEnd = event.ends_at ? new Date(event.ends_at).getTime() : null;
  const end =
    parsedEnd && Number.isFinite(parsedEnd) && parsedEnd > start
      ? parsedEnd
      : start + DEFAULT_EVENT_DURATION_MS;
  return { start, end };
}

/**
 * Lifecycle derived from stored timestamps, not from a manual flag. An event
 * whose start has passed but whose end has not is still live, never "past".
 */
export function getEventStatus(
  event: ComparableEvent,
  now: number = Date.now(),
): EventLifecycle {
  if (event.status === "draft") return "draft";
  if (event.status === "cancelled") return "cancelled";

  const window = getEventWindow(event);
  if (!window) return event.status === "published" ? "scheduled" : "draft";

  if (now < window.start) return "scheduled";
  if (now <= window.end) return "live";
  if (now - window.end > ARCHIVE_AFTER_MS) return "archived";
  return "completed";
}

export function isEventFinished(event: ComparableEvent, now: number = Date.now()): boolean {
  const window = getEventWindow(event);
  if (!window) return false;
  return now > window.end;
}

export function isEventUpcoming(event: ComparableEvent, now: number = Date.now()): boolean {
  const window = getEventWindow(event);
  if (!window) return false;
  return window.end >= now && event.status === "published";
}

/** Human label for a computed lifecycle state. */
export function eventStatusLabel(status: EventLifecycle): string {
  switch (status) {
    case "draft": return "Draft";
    case "scheduled": return "Upcoming";
    case "live": return "Live now";
    case "completed": return "Completed";
    case "archived": return "Archived";
    case "cancelled": return "Cancelled";
    default: return "Scheduled";
  }
}
