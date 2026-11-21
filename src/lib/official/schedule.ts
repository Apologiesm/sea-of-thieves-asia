/**
 * Official Sea of Thieves event schedules.
 *
 * Everything in this file is pure: no imports, no network, no database. It
 * turns the words the official Event Hub publishes into UTC occurrences, then
 * decides which occurrence is live and which is next. Keeping it pure is what
 * makes the rules testable with `node --test` and keeps the countdown UI free
 * of date maths.
 *
 * Time convention: every timestamp handled here is UTC. The Event Hub prints
 * "10am UTC" for recurring events and plain times for dated ones, which the
 * site also treats as UTC because the hub presents its calendar in UTC.
 */

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/**
 * When an occurrence has no published end we still need a window to decide
 * whether it is live. Two hours matches the shortest official live-event
 * window and is only ever used for the badge, never displayed as an end time.
 */
export const ASSUMED_LIVE_MINUTES = 120;

/** "Starting soon" begins this long before the start time. */
export const STARTING_SOON_MINUTES = 60;

/** How far ahead recurring rules are expanded when picking the next event. */
export const EXPANSION_DAYS = 120;

export type RecurrenceKind = "weekly" | "daily" | "unscheduled";

export type RecurrenceRule = {
  kind: RecurrenceKind;
  /** 0 = Sunday … 6 = Saturday, UTC. */
  weekday?: number;
  startTime?: string;
  times?: { start: string; end?: string }[];
  durationMinutes?: number | null;
};

export type EventTier = "headline" | "ambient";
export type EventStatus = "verified" | "unverified" | "cancelled";

export type OfficialEventRecord = {
  externalId: string;
  name: string;
  category: string | null;
  description: string | null;
  sourceUrl: string | null;
  artworkUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  scheduleNote: string | null;
  recurrence: RecurrenceRule | null;
  tier: EventTier;
  status: EventStatus;
  featuredShip?: string | null;
};

export type ScheduleException = {
  eventExternalId: string;
  /** UTC calendar date of the occurrence being skipped: YYYY-MM-DD. */
  occursOn: string;
  kind: "skip" | "cancelled";
  reason?: string | null;
};

export type Occurrence = {
  eventExternalId: string;
  name: string;
  category: string | null;
  description: string | null;
  sourceUrl: string | null;
  artworkUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  /** True when the end was derived from a published duration or is unknown. */
  endIsEstimated: boolean;
  scheduleNote: string | null;
  tier: EventTier;
  recurring: boolean;
  featuredShip: string | null;
};

export type OccurrenceState = "live" | "starting_soon" | "upcoming" | "completed";

export type ParsedSchedule =
  | { kind: "range"; startsAt: string; endsAt: string | null }
  | { kind: "weekly"; weekday: number; startTime: string; durationMinutes: number | null }
  | { kind: "daily"; times: { start: string; end?: string }[]; durationMinutes: number | null }
  | { kind: "unscheduled" };

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function utcDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
}

function isoDay(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Parse "10am", "1 AM", "10:00 AM", "17:00" into 24-hour "HH:MM". */
export function parseTimeToken(token: string): string | null {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(token.trim());
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

/** Pull a published duration out of the event description. */
export function parseDurationMinutes(text: string | null | undefined): number | null {
  if (!text) return null;
  const hours = /runs? for (\d+(?:\.\d+)?)\s*hours?/i.exec(text);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const days = /runs? for (\d+)\s*days?/i.exec(text);
  if (days) return Math.round(Number(days[1]) * 24 * 60);
  const hyphen = /(\d+)[- ]hour\b/i.exec(text);
  if (hyphen) return Number(hyphen[1]) * 60;
  return null;
}

function parseDatedRange(note: string): ParsedSchedule | null {
  const datePart = "(\\d{1,2})(?:st|nd|rd|th)?\\s+([A-Za-z]+)\\s+(\\d{4})(?:\\s*\\(([^)]+)\\))?";
  const range = new RegExp(`${datePart}\\s*(?:-|–|—|to)\\s*${datePart}`, "i").exec(note);
  if (range) {
    const startMonth = MONTHS[range[2].toLowerCase()];
    const endMonth = MONTHS[range[6].toLowerCase()];
    if (startMonth === undefined || endMonth === undefined) return null;
    const startTime = parseTimeToken(range[4] ?? "") ?? "00:00";
    const endTime = parseTimeToken(range[8] ?? "") ?? "00:00";
    const start = utcDate(
      Number(range[3]),
      startMonth,
      Number(range[1]),
      Number(startTime.slice(0, 2)),
      Number(startTime.slice(3, 5)),
    );
    const end = utcDate(
      Number(range[7]),
      endMonth,
      Number(range[5]),
      Number(endTime.slice(0, 2)),
      Number(endTime.slice(3, 5)),
    );
    return { kind: "range", startsAt: start.toISOString(), endsAt: end.toISOString() };
  }

  const single = new RegExp(datePart, "i").exec(note);
  if (single) {
    const month = MONTHS[single[2].toLowerCase()];
    if (month === undefined) return null;
    const time = parseTimeToken(single[4] ?? "") ?? "00:00";
    const start = utcDate(
      Number(single[3]),
      month,
      Number(single[1]),
      Number(time.slice(0, 2)),
      Number(time.slice(3, 5)),
    );
    return { kind: "range", startsAt: start.toISOString(), endsAt: null };
  }

  return null;
}

/**
 * Interpret the official date line. Accepts the exact wording the Event Hub
 * publishes; anything it cannot read confidently becomes "unscheduled" rather
 * than a guess.
 */
export function parseOfficialDateLine(
  note: string | null | undefined,
  description?: string | null,
): ParsedSchedule {
  if (!note) return { kind: "unscheduled" };
  const text = note.trim();
  const durationMinutes = parseDurationMinutes(description);

  const dated = parseDatedRange(text);
  if (dated) return dated;

  const weekly = /weekly\s*\(\s*from\s+([A-Za-z]+)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)/i.exec(text);
  if (weekly) {
    const weekday = WEEKDAYS[weekly[1].toLowerCase()];
    const startTime = parseTimeToken(weekly[2]);
    if (weekday !== undefined && startTime) {
      return { kind: "weekly", weekday, startTime, durationMinutes };
    }
  }

  const daily = /(twice daily|daily)\s*:?\s*(.+)/i.exec(text);
  if (daily) {
    const windows: { start: string; end?: string }[] = [];
    const windowPattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|—|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi;
    for (const window of daily[2].matchAll(windowPattern)) {
      const start = parseTimeToken(window[1]);
      const end = parseTimeToken(window[2]);
      if (start) windows.push({ start, ...(end ? { end } : {}) });
    }
    if (windows.length > 0) return { kind: "daily", times: windows, durationMinutes };
  }

  return { kind: "unscheduled" };
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfUtcDay(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function applyTime(day: Date, time: string): Date {
  return utcDate(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5)),
  );
}

export type ExpandedRule = { startsAt: Date; endsAt: Date | null };

/** Expand a weekly rule into concrete UTC starts between two instants. */
export function expandWeekly(
  rule: RecurrenceRule,
  from: Date,
  until: Date,
): ExpandedRule[] {
  if (rule.kind !== "weekly" || rule.weekday === undefined || !rule.startTime) return [];
  const out: ExpandedRule[] = [];
  let cursor = startOfUtcDay(addDays(from, -1));
  const limit = until.getTime();
  while (cursor.getTime() <= limit) {
    if (cursor.getUTCDay() === rule.weekday) {
      const startsAt = applyTime(cursor, rule.startTime);
      if (startsAt.getTime() <= limit) {
        const endsAt = rule.durationMinutes
          ? new Date(startsAt.getTime() + rule.durationMinutes * MINUTE_MS)
          : null;
        out.push({ startsAt, endsAt });
      }
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Expand a daily rule (for example Gold Rush's two windows per day). */
export function expandDaily(rule: RecurrenceRule, from: Date, until: Date): ExpandedRule[] {
  if (rule.kind !== "daily" || !rule.times?.length) return [];
  const out: ExpandedRule[] = [];
  let cursor = startOfUtcDay(addDays(from, -1));
  const limit = until.getTime();
  while (cursor.getTime() <= limit) {
    for (const window of rule.times) {
      const startsAt = applyTime(cursor, window.start);
      if (startsAt.getTime() > limit) continue;
      const endsAt = window.end ? applyTime(cursor, window.end) : null;
      out.push({ startsAt, endsAt });
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function expandRule(rule: RecurrenceRule, from: Date, until: Date): ExpandedRule[] {
  if (rule.kind === "weekly") return expandWeekly(rule, from, until);
  if (rule.kind === "daily") return expandDaily(rule, from, until);
  return [];
}

/**
 * A dated special event can cancel a recurring session that would run at the
 * same time. Last Ship Standing replaces that week's Fight Night; nothing else
 * is suppressed, so a sale or a season does not hide weekly events.
 */
export const SUPPRESSION_RULES: { replaces: RegExp; suppresses: RegExp }[] = [
  { replaces: /last ship standing/i, suppresses: /fight nights?/i },
];

function dateRangeCovers(occurrence: { startsAt: Date; endsAt: Date | null }, startsAt: Date, endsAt: Date) {
  const occEnd = occurrence.endsAt ?? new Date(occurrence.startsAt.getTime() + ASSUMED_LIVE_MINUTES * MINUTE_MS);
  return occurrence.startsAt.getTime() < endsAt.getTime() && occEnd.getTime() > startsAt.getTime();
}

export type BuildOptions = {
  now: Date;
  from?: Date;
  until?: Date;
  exceptions?: ScheduleException[];
};

/** Turn stored records into every occurrence we care about, newest rules expanded. */
export function buildOccurrences(
  events: OfficialEventRecord[],
  options: BuildOptions,
): Occurrence[] {
  const now = options.now;
  const from = options.from ?? addDays(now, -2);
  const until = options.until ?? addDays(now, EXPANSION_DAYS);
  const exceptions = options.exceptions ?? [];

  // Only rows confirmed against an official source may be shown or counted down.
  const usable = events.filter((event) => event.status === "verified");
  const datedEvents = usable.filter((event) => event.startsAt);
  const skipped = new Set(
    exceptions.map((exception) => `${exception.eventExternalId}|${exception.occursOn}`),
  );

  const occurrences: Occurrence[] = [];

  for (const event of usable) {
    const base = {
      eventExternalId: event.externalId,
      name: event.name,
      category: event.category,
      description: event.description,
      sourceUrl: event.sourceUrl,
      artworkUrl: event.artworkUrl,
      scheduleNote: event.scheduleNote,
      tier: event.tier,
      featuredShip: event.featuredShip ?? null,
    };

    if (event.startsAt) {
      occurrences.push({
        ...base,
        startsAt: new Date(event.startsAt).toISOString(),
        endsAt: event.endsAt ? new Date(event.endsAt).toISOString() : null,
        endIsEstimated: !event.endsAt,
        recurring: false,
      });
      continue;
    }

    if (!event.recurrence) continue;

    for (const rule of expandRule(event.recurrence, from, until)) {
      const day = isoDay(rule.startsAt);
      if (skipped.has(`${event.externalId}|${day}`)) continue;
      if (skipped.has(`*|${day}`)) continue;

      const rule_ends = rule.endsAt;
      const startIso = rule.startsAt;
      const endIso = rule_ends?.toISOString() ?? null;

      const replaced = SUPPRESSION_RULES.some((ruleEntry) => {
        if (!ruleEntry.suppresses.test(event.name)) return false;
        return datedEvents.some((candidate) => {
          if (!ruleEntry.replaces.test(candidate.name)) return false;
          const cStart = new Date(candidate.startsAt as string);
          const cEnd = candidate.endsAt
            ? new Date(candidate.endsAt)
            : new Date(cStart.getTime() + ASSUMED_LIVE_MINUTES * MINUTE_MS);
          return dateRangeCovers({ startsAt: startIso, endsAt: endIso ? new Date(endIso) : null }, cStart, cEnd);
        });
      });
      if (replaced) continue;

      occurrences.push({
        ...base,
        startsAt: startIso.toISOString(),
        endsAt: endIso,
        endIsEstimated: !endIso,
        recurring: true,
      });
    }
  }

  const seen = new Set<string>();
  return occurrences
    .filter((occurrence) => {
      // Two announcements of the same event must not produce two cards.
      const key = occurrence.eventExternalId + "|" + occurrence.startsAt;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // Occurrences that already finished never belong in a "next" selection.
    .filter((occurrence) => occurrenceState(occurrence, now) !== "completed")
    .sort((a, b) => {
      const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
}

function estimatedEnd(occurrence: Occurrence): Date {
  if (occurrence.endsAt) return new Date(occurrence.endsAt);
  return new Date(new Date(occurrence.startsAt).getTime() + ASSUMED_LIVE_MINUTES * MINUTE_MS);
}

export function occurrenceState(occurrence: Occurrence, now: Date): OccurrenceState {
  const start = new Date(occurrence.startsAt).getTime();
  const end = estimatedEnd(occurrence).getTime();
  const current = now.getTime();
  if (current >= end) return "completed";
  if (current >= start) return "live";
  if (start - current <= STARTING_SOON_MINUTES * MINUTE_MS) return "starting_soon";
  return "upcoming";
}

export type NextOfficialSelection = {
  live: Occurrence | null;
  next: Occurrence | null;
  /** "live" when something is running now, otherwise whether a next event exists. */
  state: "live" | "upcoming" | "none";
};

/**
 * Pick what is live now and what comes next.
 *
 * Headline occurrences win over ambient ones. Gold Rush windows land twice a
 * day, so including them would permanently mask every weekly and special
 * event; they are only surfaced when no headline event exists at all.
 */
export function selectNextOfficial(
  occurrences: Occurrence[],
  now: Date,
): NextOfficialSelection {
  const evaluate = (pool: Occurrence[]): NextOfficialSelection => {
    const live = pool.find((occurrence) => occurrenceState(occurrence, now) === "live") ?? null;
    const next =
      pool.find((occurrence) => new Date(occurrence.startsAt).getTime() > now.getTime()) ?? null;
    return { live, next, state: live ? "live" : next ? "upcoming" : "none" };
  };

  const headline = occurrences.filter((occurrence) => occurrence.tier === "headline");
  const primary = evaluate(headline);
  if (primary.state !== "none") return primary;

  const ambient = occurrences.filter((occurrence) => occurrence.tier === "ambient");
  return evaluate(ambient);
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  /** Two-digit strings for the HUD, days unpadded beyond 2 digits. */
  display: { days: string; hours: string; minutes: string; seconds: string };
};

export function countdownParts(targetIso: string, now: Date): CountdownParts {
  const totalMs = Math.max(0, new Date(targetIso).getTime() - now.getTime());
  const days = Math.floor(totalMs / DAY_MS);
  const hours = Math.floor((totalMs % DAY_MS) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / MINUTE_MS);
  const seconds = Math.floor((totalMs % MINUTE_MS) / 1000);
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    display: {
      days: String(days).padStart(2, "0"),
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
    },
  };
}

/** "This Month in Sea of Thieves: November 2026" -> "this-month-...". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Stable identity for an official event.
 *
 * Dated events include the year so next year's repeat is a separate row, but
 * not the exact date, so an updated date updates the existing row instead of
 * creating a duplicate.
 */
export function officialEventKey(
  name: string,
  schedule: ParsedSchedule,
  reference?: Date,
): string {
  const slug = slugify(name) || "official-event";
  if (schedule.kind === "weekly") return `${slug}-weekly-${schedule.startTime.replace(":", "")}`;
  if (schedule.kind === "daily") return `${slug}-daily`;
  if (schedule.kind === "range") {
    const year = new Date(schedule.startsAt).getUTCFullYear();
    return `${slug}-${year}`;
  }
  return `${slug}-${(reference ?? new Date()).getUTCFullYear()}`;
}

/**
 * Merge a fresh read over stored rows. A failed or partial read must never
 * blank out artwork, description or dates that were previously verified.
 */
export function mergeOfficialEvents(
  parsed: OfficialEventRecord[],
  existing: OfficialEventRecord[],
): OfficialEventRecord[] {
  const byKey = new Map(existing.map((event) => [event.externalId, event]));
  return parsed.map((event) => {
    const previous = byKey.get(event.externalId);
    if (!previous) return event;
    return {
      ...event,
      artworkUrl: event.artworkUrl ?? previous.artworkUrl,
      description: event.description ?? previous.description,
      sourceUrl: event.sourceUrl ?? previous.sourceUrl,
      startsAt: event.startsAt ?? previous.startsAt,
      endsAt: event.endsAt ?? previous.endsAt,
      scheduleNote: event.scheduleNote ?? previous.scheduleNote,
      recurrence: event.recurrence ?? previous.recurrence,
      featuredShip: event.featuredShip ?? previous.featuredShip,
    };
  });
}
