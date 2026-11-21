"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  EVENT_PLATFORMS,
  EVENT_REGIONS,
  EVENT_STATUSES,
  EVENT_TYPES,
} from "@/lib/content/site-config";
import { isoToZonedLocal, zonedDateTimeToIso } from "@/lib/event/time";
import { DEFAULT_TIME_ZONE, TIME_ZONE_OPTIONS, getTimeZoneOffsetLabel } from "@/lib/time/zone";
import { MediaPasteUploader } from "@/components/MediaPasteUploader";
import type { EventRecord, EventStatus, EventType } from "@/lib/event/types";

type Values = {
  title: string;
  description: string;
  eventType: EventType;
  region: string;
  platform: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  location: string;
  discordEventUrl: string;
  maxAttendees: string;
  imageUrl: string | null;
  status: EventStatus;
};

const EMPTY: Values = {
  title: "",
  description: "",
  eventType: "fleet_night",
  region: "",
  platform: "",
  timezone: DEFAULT_TIME_ZONE,
  startsAt: "",
  endsAt: "",
  location: "",
  discordEventUrl: "",
  maxAttendees: "",
  imageUrl: null,
  status: "draft",
};

function fromEvent(event: EventRecord): Values {
  return {
    title: event.title,
    description: event.description ?? "",
    eventType: event.event_type ?? "fleet_night",
    region: event.region ?? "",
    platform: event.platform ?? "",
    timezone: event.timezone,
    startsAt: isoToZonedLocal(event.starts_at, event.timezone),
    endsAt: isoToZonedLocal(event.ends_at, event.timezone),
    location: event.location ?? "",
    discordEventUrl: event.discord_event_url ?? "",
    maxAttendees: event.max_attendees ? String(event.max_attendees) : "",
    imageUrl: event.image_url ?? null,
    status: event.status,
  };
}

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content outline-none focus:border-brand";
const labelClass = "block text-sm font-medium text-content";

export function EventForm({ event }: { event?: EventRecord }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(event ? fromEvent(event) : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...values,
      startsAt: zonedDateTimeToIso(values.startsAt, values.timezone),
      endsAt: zonedDateTimeToIso(values.endsAt, values.timezone),
    };

    const response = await fetch(event ? `/api/events/${event.id}` : "/api/events", {
      method: event ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Could not save the event.");
      setSaving(false);
      return;
    }
    router.push("/events/manage");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="rounded-card border border-border bg-surface/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-content">Event details</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Title</span>
            <input className={fieldClass} value={values.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Description</span>
            <textarea className={fieldClass} rows={5} value={values.description} maxLength={800} onChange={(e) => set("description", e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <MediaPasteUploader
              label="Event image"
              hint="Optional flyer or banner shown on the event card. JPEG, PNG, WebP or GIF up to 5 MB."
              value={values.imageUrl}
              onChange={(url) => set("imageUrl", url)}
            />
          </div>
          <label>
            <span className={labelClass}>Event type</span>
            <select className={fieldClass} value={values.eventType} onChange={(e) => set("eventType", e.target.value as EventType)}>
              {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Status</span>
            <select className={fieldClass} value={values.status} onChange={(e) => set("status", e.target.value as EventStatus)}>
              {EVENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Region</span>
            <select className={fieldClass} value={values.region} onChange={(e) => set("region", e.target.value)}>
              <option value="">Not specified</option>
              {EVENT_REGIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Platform</span>
            <select className={fieldClass} value={values.platform} onChange={(e) => set("platform", e.target.value)}>
              <option value="">Not specified</option>
              {EVENT_PLATFORMS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Timezone</span>
            <select className={fieldClass} value={values.timezone} onChange={(e) => set("timezone", e.target.value)}>
              {TIME_ZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({getTimeZoneOffsetLabel(option.value)})
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-content-muted">
              Times below are entered in this zone and saved as UTC.
            </span>
          </label>
          <label>
            <span className={labelClass}>Location / channel</span>
            <input className={fieldClass} value={values.location} maxLength={120} onChange={(e) => set("location", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>Starts at</span>
            <input type="datetime-local" className={fieldClass} value={values.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>Ends at (optional)</span>
            <input type="datetime-local" className={fieldClass} value={values.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>Max attendees (optional)</span>
            <input type="number" min={1} max={500} className={fieldClass} value={values.maxAttendees} onChange={(e) => set("maxAttendees", e.target.value)} />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Discord event link (optional)</span>
            <input className={fieldClass} value={values.discordEventUrl} placeholder="https://discord.com/events/..." onChange={(e) => set("discordEventUrl", e.target.value)} />
          </label>
        </div>
      </div>

      <div>
        <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas hover:bg-brand-strong disabled:opacity-60">
          {saving ? "Saving…" : event ? "Save event" : "Create event"}
        </button>
        {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    </form>
  );
}
