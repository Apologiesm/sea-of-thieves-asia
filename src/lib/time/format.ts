/**
 * Time formatting shared by server components and the client `LocalTime`.
 * Pure functions only — safe to import from either environment.
 */

export const DEFAULT_TIME_ZONE = "Asia/Singapore";

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

export function formatInZone(
  iso: string | null,
  timeZone: string | null,
  options: Intl.DateTimeFormatOptions,
  fallbackText = "Time to be announced",
): string {
  if (!iso) return fallbackText;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone ?? DEFAULT_TIME_ZONE,
      ...options,
    }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: DEFAULT_TIME_ZONE,
      ...options,
    }).format(new Date(iso));
  }
}

/** The visitor's own IANA zone, or null during server render. */
export function viewerTimeZone(): string | null {
  if (typeof Intl === "undefined") return null;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone || null;
}
