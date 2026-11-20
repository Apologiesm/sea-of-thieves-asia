import Link from "next/link";
import type { EventRecord } from "@/lib/event/types";
import { eventDateKey } from "@/lib/event/time";

type Props = { events: EventRecord[]; month: string };

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function eventTime(event: EventRecord): string {
  if (!event.starts_at) return "TBA";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: event.timezone || "Asia/Singapore",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(event.starts_at));
  } catch {
    return new Date(event.starts_at).toLocaleTimeString();
  }
}

export function EventCalendar({ events, month }: Props) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // Monday first
  const todayKey = `${year}-${String(monthNumber).padStart(2, "0")}-${String(new Date().getUTCDate()).padStart(2, "0")}`;

  const byDay = new Map<string, EventRecord[]>();
  events.forEach((event) => {
    const key = eventDateKey(event.starts_at, event.timezone);
    if (!key.startsWith(month)) return;
    const list = byDay.get(key) ?? [];
    list.push(event);
    byDay.set(key, list);
  });

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="calendar">
      <div className="calendar__head">
        <Link href={`/events?view=calendar&month=${shiftMonth(month, -1)}`} className="calendar__nav" aria-label="Previous month">←</Link>
        <h2 className="calendar__title">
          {new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}
        </h2>
        <Link href={`/events?view=calendar&month=${shiftMonth(month, 1)}`} className="calendar__nav" aria-label="Next month">→</Link>
      </div>
      <div className="calendar__weekdays" aria-hidden="true">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar__grid">
        {cells.map((day, index) => {
          const key = day ? `${month}-${String(day).padStart(2, "0")}` : "";
          const dayEvents = day ? (byDay.get(key) ?? []) : [];
          return (
            <div key={index} className={`calendar__cell${key === todayKey ? " calendar__cell--today" : ""}`}>
              {day ? <span className="calendar__day">{day}</span> : null}
              <div className="calendar__events">
                {dayEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="calendar__event">
                    <span>{eventTime(event)}</span>
                    <strong>{event.title}</strong>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
