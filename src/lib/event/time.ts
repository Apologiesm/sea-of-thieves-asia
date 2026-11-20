const FALLBACK = "Asia/Singapore";

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone, ...options });
  } catch {
    return new Intl.DateTimeFormat("en-GB", { timeZone: FALLBACK, ...options });
  }
}

export function formatDateTime(iso: string | null, timeZone: string | null): string {
  if (!iso) return "Time to be announced";
  return formatter(timeZone ?? FALLBACK, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatTimeRange(
  start: string | null,
  end: string | null,
  timeZone: string | null,
): string {
  if (!start) return "Time to be announced";
  const begin = formatDateTime(start, timeZone);
  if (!end) return begin;
  return `${begin} – ${formatDateTime(end, timeZone)}`;
}

export function timezoneLabel(timeZone: string | null): string {
  return timeZone ?? FALLBACK;
}

/** YYYY-MM-DD key in the event's own timezone, for calendar grouping. */
export function eventDateKey(iso: string | null, timeZone: string | null): string {
  if (!iso) return "";
  const parts = partsInZone(new Date(iso), timeZone ?? FALLBACK);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

type Parts = Record<string, string>;

function partsInZone(date: Date, timeZone: string): Parts {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const result: Parts = {};
  formatted.forEach((part) => {
    if (part.type !== "literal") result[part.type] = part.value;
  });
  return result;
}

/** Convert an IANA wall-clock time into a UTC ISO string. */
export function zonedDateTimeToIso(local: string, timeZone: string | null): string | null {
  if (!local) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match.map(Number);
  const zone = timeZone ?? FALLBACK;
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

/** Convert a UTC ISO string into a datetime-local value in the event timezone. */
export function isoToZonedLocal(iso: string | null, timeZone: string | null): string {
  if (!iso) return "";
  try {
    const parts = partsInZone(new Date(iso), timeZone ?? FALLBACK);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  } catch {
    return iso.slice(0, 16);
  }
}
