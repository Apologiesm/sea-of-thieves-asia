import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSUMED_LIVE_MINUTES,
  buildOccurrences,
  countdownParts,
  expandWeekly,
  mergeOfficialEvents,
  occurrenceState,
  officialEventKey,
  parseOfficialDateLine,
  selectNextOfficial,
  type OfficialEventRecord,
  type RecurrenceRule,
} from "../src/lib/official/schedule.ts";
import { cleanEventName, parseEventHub, featuredShipFrom } from "../src/lib/official/event-hub.ts";

const MINUTE = 60_000;

function weekly(
  name: string,
  weekday: number,
  startTime: string,
  durationMinutes: number | null = null,
  externalId = `${name.toLowerCase().replace(/\s+/g, "-")}-weekly`,
): OfficialEventRecord {
  return {
    externalId,
    name,
    category: "Weekly event",
    description: null,
    sourceUrl: "https://www.seaofthieves.com/event-hub",
    artworkUrl: null,
    startsAt: null,
    endsAt: null,
    scheduleNote: `Weekly (from ${startTime})`,
    recurrence: { kind: "weekly", weekday, startTime, durationMinutes },
    tier: "headline",
    status: "verified",
  };
}

function dated(
  name: string,
  startsAt: string,
  endsAt: string | null,
  externalId = `${name.toLowerCase().replace(/\s+/g, "-")}-2026`,
): OfficialEventRecord {
  return {
    externalId,
    name,
    category: "Special event",
    description: null,
    sourceUrl: "https://www.seaofthieves.com/event-hub",
    artworkUrl: null,
    startsAt,
    endsAt,
    scheduleNote: null,
    recurrence: null,
    tier: "headline",
    status: "verified",
  };
}

const NOW = new Date("2026-11-21T04:00:00.000Z"); // a Saturday

test("Fight Nights repeats every Tuesday at 10:00 UTC", () => {
  const fightNights = weekly("Weekly Fight Nights", 2, "10:00");
  const occurrences = buildOccurrences([fightNights], { now: NOW });
  const starts = occurrences.map((occurrence) => occurrence.startsAt);

  assert.equal(starts[0], "2026-11-24T10:00:00.000Z");
  assert.equal(starts[1], "2026-12-01T10:00:00.000Z");
  assert.equal(starts[2], "2026-12-08T10:00:00.000Z");
  assert.ok(occurrences.every((occurrence) => occurrence.recurring));
});

test("Emissaries of Fortune repeats weekly and runs for 24 hours", () => {
  const emissaries = weekly("Emissaries of Fortune", 3, "10:00", 24 * 60);
  const occurrences = buildOccurrences([emissaries], { now: NOW });

  assert.equal(occurrences[0].startsAt, "2026-11-25T10:00:00.000Z");
  assert.equal(occurrences[0].endsAt, "2026-11-26T10:00:00.000Z");
  assert.equal(occurrences[1].startsAt, "2026-12-02T10:00:00.000Z");
});

test("Last Ship Standing removes the Fight Night it replaces", () => {
  const fightNights = weekly("Weekly Fight Nights", 2, "10:00");
  // Runs Tuesday 24th 10:00 through Thursday 26th 10:00.
  const lastShip = dated("Last Ship Standing", "2026-11-24T10:00:00.000Z", "2026-11-26T10:00:00.000Z");

  const occurrences = buildOccurrences([fightNights, lastShip], { now: NOW });
  const fightNightStarts = occurrences
    .filter((occurrence) => occurrence.name === "Weekly Fight Nights")
    .map((occurrence) => occurrence.startsAt);

  assert.ok(!fightNightStarts.includes("2026-11-24T10:00:00.000Z"), "suppressed Tuesday is gone");
  assert.ok(fightNightStarts.includes("2026-12-01T10:00:00.000Z"), "the following week still runs");
});

test("a sale or season does not suppress a weekly event", () => {
  const fightNights = weekly("Weekly Fight Nights", 2, "10:00");
  const sale = dated("Black Friday Sale", "2026-11-25T10:00:00.000Z", "2026-12-02T10:00:00.000Z");

  const occurrences = buildOccurrences([fightNights, sale], { now: NOW });
  const fightNightStarts = occurrences
    .filter((occurrence) => occurrence.name === "Weekly Fight Nights")
    .map((occurrence) => occurrence.startsAt);

  assert.ok(fightNightStarts.includes("2026-11-24T10:00:00.000Z"));
});

test("different featured ship types survive the round trip", () => {
  const sloops = dated("Last Ship Standing: Sloops", "2026-11-24T10:00:00.000Z", "2026-11-26T10:00:00.000Z");
  sloops.featuredShip = "Sloop";
  const galleons = dated("Last Ship Standing: Galleons", "2026-12-08T10:00:00.000Z", "2026-12-10T10:00:00.000Z");
  galleons.featuredShip = "Galleon";

  const occurrences = buildOccurrences([sloops, galleons], { now: NOW });
  assert.equal(occurrences[0].featuredShip, "Sloop");
  assert.equal(occurrences[1].featuredShip, "Galleon");
  assert.equal(featuredShipFrom("Sloops only this week"), "Sloop");
  assert.equal(featuredShipFrom("Fair winds to all Galleons"), "Galleon");
  assert.equal(featuredShipFrom("No ship named here"), null);
});

test("an explicit exception skips a single occurrence", () => {
  const fightNights = weekly("Weekly Fight Nights", 2, "10:00");
  const occurrences = buildOccurrences([fightNights], {
    now: NOW,
    exceptions: [
      { eventExternalId: fightNights.externalId, occursOn: "2026-12-01", kind: "skip", reason: "holiday" },
    ],
  });
  const starts = occurrences.map((occurrence) => occurrence.startsAt);

  assert.ok(!starts.includes("2026-12-01T10:00:00.000Z"));
  assert.ok(starts.includes("2026-11-24T10:00:00.000Z"));
  assert.ok(starts.includes("2026-12-08T10:00:00.000Z"));
});

test("a range crossing UTC midnight keeps both dates", () => {
  const schedule = parseOfficialDateLine(
    "31st December 2026 (10:00 PM) - 1st January 2027 (2:00 AM)",
    null,
  );
  assert.equal(schedule.kind, "range");
  if (schedule.kind !== "range") return;
  assert.equal(schedule.startsAt, "2026-12-31T22:00:00.000Z");
  assert.equal(schedule.endsAt, "2027-01-01T02:00:00.000Z");
});

test("a weekly rule stays at 10:00 UTC across a daylight-saving change", () => {
  const rule: RecurrenceRule = { kind: "weekly", weekday: 2, startTime: "10:00", durationMinutes: null };
  const before = expandWeekly(rule, new Date("2026-03-01T00:00:00.000Z"), new Date("2026-03-31T00:00:00.000Z"));
  const after = expandWeekly(rule, new Date("2026-10-20T00:00:00.000Z"), new Date("2026-11-15T00:00:00.000Z"));

  assert.ok(before.every((entry) => entry.startsAt.getUTCHours() === 10));
  assert.ok(after.every((entry) => entry.startsAt.getUTCHours() === 10));
});

test("an event starting in under a minute is STARTING SOON, then live", () => {
  const event = dated("Community Weekend", "2026-11-21T04:00:30.000Z", "2026-11-22T04:00:00.000Z");
  const [occurrence] = buildOccurrences([event], { now: NOW });

  assert.equal(occurrenceState(occurrence, new Date("2026-11-21T04:00:00.000Z")), "starting_soon");
  assert.equal(occurrenceState(occurrence, new Date("2026-11-21T04:00:30.000Z")), "live");
  assert.equal(occurrenceState(occurrence, new Date("2026-11-21T05:30:00.000Z")), "live");
});

test("the countdown reaches zero and the event completes", () => {
  const event = dated("Renown Rally", "2026-11-21T04:01:00.000Z", "2026-11-21T06:00:00.000Z");
  const [occurrence] = buildOccurrences([event], { now: NOW });

  const oneMinuteBefore = countdownParts(occurrence.startsAt, new Date("2026-11-21T04:00:00.000Z"));
  assert.deepEqual(oneMinuteBefore.display, { days: "00", hours: "00", minutes: "01", seconds: "00" });

  const atStart = countdownParts(occurrence.startsAt, new Date("2026-11-21T04:01:00.000Z"));
  assert.equal(atStart.totalMs, 0);

  assert.equal(occurrenceState(occurrence, new Date("2026-11-21T06:00:00.000Z")), "completed");
  assert.equal(occurrenceState(occurrence, new Date("2026-11-21T06:30:00.000Z")), "completed");
});

test("with nothing scheduled the selection is empty rather than invented", () => {
  const selection = selectNextOfficial([], NOW);
  assert.equal(selection.state, "none");
  assert.equal(selection.next, null);
  assert.equal(selection.live, null);
});

test("a live event is reported as live while the next event stays next", () => {
  const live = dated("Community Weekend", "2026-11-21T02:00:00.000Z", "2026-11-22T02:00:00.000Z");
  const later = dated("Renown Rally", "2026-11-25T10:00:00.000Z", "2026-11-25T18:00:00.000Z");

  const occurrences = buildOccurrences([live, later], { now: NOW });
  const selection = selectNextOfficial(occurrences, NOW);

  assert.equal(selection.state, "live");
  assert.equal(selection.live?.name, "Community Weekend");
  assert.equal(selection.next?.name, "Renown Rally");
});

test("an event without a published end stays live for the assumed window only", () => {
  const open = dated("Weekly Fight Nights", "2026-11-21T04:00:00.000Z", null);
  const [occurrence] = buildOccurrences([open], { now: NOW });

  assert.equal(occurrence.endIsEstimated, true);
  assert.equal(occurrenceState(occurrence, new Date(NOW.getTime() + MINUTE)), "live");
  assert.equal(
    occurrenceState(occurrence, new Date(NOW.getTime() + (ASSUMED_LIVE_MINUTES + 1) * MINUTE)),
    "completed",
  );
});

test("duplicate announcements collapse to one occurrence", () => {
  const first = weekly("Weekly Fight Nights", 2, "10:00");
  const duplicate = { ...first, description: "same event, second announcement" };

  const occurrences = buildOccurrences([first, duplicate], { now: NOW });
  const tuesdays = occurrences.filter((occurrence) => occurrence.startsAt === "2026-11-24T10:00:00.000Z");

  assert.equal(tuesdays.length, 1);
});

test("an updated date updates the same event instead of creating a new one", () => {
  const original = parseOfficialDateLine("25th November 2026 (10:00 AM) - 2nd December 2026 (10:00 AM)", null);
  const updated = parseOfficialDateLine("26th November 2026 (10:00 AM) - 3rd December 2026 (10:00 AM)", null);

  assert.equal(officialEventKey("Black Friday Sale", original), officialEventKey("Black Friday Sale", updated));
  assert.equal(officialEventKey("Black Friday Sale", original), "black-friday-sale-2026");

  const merged = mergeOfficialEvents(
    [{ ...dated("Black Friday Sale", "2026-11-26T10:00:00.000Z", "2026-12-03T10:00:00.000Z"), artworkUrl: null }],
    [{ ...dated("Black Friday Sale", "2026-11-25T10:00:00.000Z", "2026-12-02T10:00:00.000Z"), artworkUrl: "https://example.test/friday.jpg" }],
  );
  assert.equal(merged[0].startsAt, "2026-11-26T10:00:00.000Z");
  assert.equal(merged[0].artworkUrl, "https://example.test/friday.jpg");
});

test("a failed read preserves previously stored artwork and dates", () => {
  const stored = dated("Season 21 Live Event", "2026-11-10T10:00:00.000Z", "2026-11-20T10:00:00.000Z");
  stored.artworkUrl = "https://example.test/season.jpg";
  stored.description = "Original description";

  const partialRead: OfficialEventRecord = {
    ...stored,
    startsAt: null,
    endsAt: null,
    artworkUrl: null,
    description: null,
  };

  const [merged] = mergeOfficialEvents([partialRead], [stored]);
  assert.equal(merged.startsAt, stored.startsAt);
  assert.equal(merged.endsAt, stored.endsAt);
  assert.equal(merged.artworkUrl, stored.artworkUrl);
  assert.equal(merged.description, "Original description");
});

test("a newly introduced official event format needs no schema change", () => {
  const schedule = parseOfficialDateLine("Weekly (from Friday 6pm UTC)", "Runs for 3 hours.");
  assert.equal(schedule.kind, "weekly");
  if (schedule.kind !== "weekly") return;
  assert.equal(schedule.weekday, 5);
  assert.equal(schedule.startTime, "18:00");
  assert.equal(schedule.durationMinutes, 180);

  const brandNew = weekly("Bilge Rats Weekender", 5, "18:00", 180, "bilge-rats-weekender-weekly");
  const occurrences = buildOccurrences([brandNew], { now: NOW });
  assert.equal(occurrences[0].startsAt, "2026-11-27T18:00:00.000Z");
  assert.equal(occurrences[0].endsAt, "2026-11-27T21:00:00.000Z");
});

test("the Event Hub date wordings are read exactly as published", () => {
  const weeklySchedule = parseOfficialDateLine("Weekly (from Wednesday 10am UTC)", "Runs for 24 hours every week.");
  assert.equal(weeklySchedule.kind, "weekly");
  if (weeklySchedule.kind === "weekly") {
    assert.equal(weeklySchedule.weekday, 3);
    assert.equal(weeklySchedule.startTime, "10:00");
    assert.equal(weeklySchedule.durationMinutes, 1440);
  }

  const dailySchedule = parseOfficialDateLine("Twice Daily: 1am - 2am and 5pm - 6pm UTC", null);
  assert.equal(dailySchedule.kind, "daily");
  if (dailySchedule.kind === "daily") {
    assert.equal(dailySchedule.times.length, 2);
    assert.equal(dailySchedule.times[0].start, "01:00");
    assert.equal(dailySchedule.times[1].start, "17:00");
  }

  assert.equal(parseOfficialDateLine("Once a Season", null).kind, "unscheduled");
  assert.equal(parseOfficialDateLine("Updated Regularly", null).kind, "unscheduled");
  assert.equal(parseOfficialDateLine(null, null).kind, "unscheduled");
});

test("the hub parser reads panels, buckets and flags from real markup", () => {
  const html = `
    <div class="event-bucket container event-bucket--featured">
      <h2 class="generic-title-header align-center event-bucket__heading">
        <span class="pseudo-after underlined-heading-underscore">The Main Events</span>
      </h2>
      <div class="event-panel event-panel--style1 event-panel--align-left"><div class="event-panel-inner">
        <div class="event-panel-inner__image"><div class="background-image background-image--center-center"></div></div>
        <div class="event-panel-inner__panel"><div class="event-panel-inner__panel-wrapper">
          <div class="event-panel-inner__flag"><span class="event-panel-inner__flag-label">Coming Soon</span></div>
          <h3 class="event-panel-inner__header event-panel-inner--style1-header-white">Black Friday Sale</h3>
          <div class="event-panel-inner__date">25th November 2026 (10:00 AM) - 2nd December 2026 (10:00 AM)</div>
          <div class="event-panel-inner__body">Browse discounts of up to 50% in the Pirate Emporium!</div>
        </div></div>
      </div></div>
      <div class="event-panel event-panel--style1 event-panel--align-right"><div class="event-panel-inner">
        <div class="event-panel-inner__image"><div class="background-image background-image--center-center"></div></div>
        <div class="event-panel-inner__panel"><div class="event-panel-inner__panel-wrapper">
          <h3 class="event-panel-inner__header event-panel-inner--style1-header-white">Season 21 Live Now! </h3>
          <div class="event-panel-inner__body">Seek out new rewards.</div>
          <div class="cta"><a href="https://www.seaofthieves.com/season-21">Find Out More</a></div>
        </div></div>
      </div></div>
    </div>
    <div class="event-bucket container">
      <h2 class="generic-title-header align-center event-bucket__heading">
        <span class="pseudo-after underlined-heading-underscore">Recurring and Upcoming</span>
      </h2>
      <div class="event-panel event-panel--style1"><div class="event-panel-inner">
        <div class="event-panel-inner__panel"><div class="event-panel-inner__panel-wrapper">
          <h3 class="event-panel-inner__header">Weekly Fight Nights</h3>
          <div class="event-panel-inner__date">Weekly (from Tuesday 10am UTC)</div>
          <div class="event-panel-inner__body">The Battle for the Sea of Thieves rages on!</div>
        </div></div>
      </div></div>
    </div>`;

  const panels = parseEventHub(html);
  assert.equal(panels.length, 3);
  assert.equal(panels[0].name, "Black Friday Sale");
  assert.equal(panels[0].flag, "Coming Soon");
  assert.equal(panels[0].bucket, "The Main Events");
  assert.match(panels[0].dateLine ?? "", /25th November 2026/);
  assert.equal(panels[1].name, "Season 21", "the Live Now suffix is not part of the name");
  assert.equal(panels[1].link, "https://www.seaofthieves.com/season-21");
  assert.equal(panels[2].bucket, "Recurring and Upcoming");
  assert.equal(cleanEventName("  Season 21 Live Now!  "), "Season 21");
});

test("ambient daily bonuses never mask a headline event", () => {
  const goldRush: OfficialEventRecord = {
    ...weekly("Gold Rush", 0, "01:00", null, "gold-rush-daily"),
    tier: "ambient",
    recurrence: { kind: "daily", times: [{ start: "01:00", end: "02:00" }, { start: "17:00", end: "18:00" }] },
  };
  const fightNights = weekly("Weekly Fight Nights", 2, "10:00");

  const occurrences = buildOccurrences([goldRush, fightNights], { now: NOW });
  const selection = selectNextOfficial(occurrences, NOW);

  assert.equal(selection.next?.name, "Weekly Fight Nights");
  assert.equal(selection.next?.startsAt, "2026-11-24T10:00:00.000Z");

  const ambientOnly = selectNextOfficial(
    buildOccurrences([goldRush], { now: NOW }),
    NOW,
  );
  assert.equal(ambientOnly.next?.name, "Gold Rush");
});

test("only verified events are ever selected", () => {
  const unverified = { ...dated("Rumoured Event", "2026-11-22T10:00:00.000Z", "2026-11-22T12:00:00.000Z"), status: "unverified" as const };
  const cancelled = { ...dated("Cancelled Event", "2026-11-23T10:00:00.000Z", "2026-11-23T12:00:00.000Z"), status: "cancelled" as const };

  const selection = selectNextOfficial(buildOccurrences([unverified, cancelled], { now: NOW }), NOW);
  assert.equal(selection.state, "none");
});

test("days, hours, minutes and seconds are padded for the HUD", () => {
  const parts = countdownParts("2026-11-24T10:00:00.000Z", new Date("2026-11-21T04:00:00.000Z"));
  assert.equal(parts.days, 3);
  assert.equal(parts.hours, 6);
  assert.deepEqual(parts.display, { days: "03", hours: "06", minutes: "00", seconds: "00" });
});
