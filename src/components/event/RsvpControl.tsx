"use client";

import { useState } from "react";
import type { RsvpStatus } from "@/lib/event/types";

const OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "cant_go", label: "Can't go" },
];

export function RsvpControl({ eventId, initial }: { eventId: string; initial: RsvpStatus | null }) {
  const [status, setStatus] = useState<RsvpStatus | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(value: RsvpStatus) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Could not save your RSVP.");
      setBusy(false);
      return;
    }
    setStatus(value);
    setBusy(false);
  }

  async function clear() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/events/${eventId}/rsvp`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not clear your RSVP.");
      setBusy(false);
      return;
    }
    setStatus(null);
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={busy}
            onClick={() => choose(option.value)}
            className={`min-h-11 rounded-lg border px-4 text-sm disabled:opacity-50 ${
              status === option.value
                ? "border-brand bg-brand/15 text-content"
                : "border-border text-content-muted hover:text-content"
            }`}
          >
            {option.label}
          </button>
        ))}
        {status ? (
          <button type="button" onClick={clear} disabled={busy} className="min-h-11 px-3 text-sm text-content-muted underline underline-offset-4">
            Clear RSVP
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
