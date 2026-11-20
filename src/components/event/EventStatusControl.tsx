"use client";

import { useState } from "react";
import type { EventStatus } from "@/lib/event/types";

const ACTIONS: EventStatus[] = ["draft", "published", "cancelled", "completed"];

export function EventStatusControl({ eventId, current }: { eventId: string; current: EventStatus }) {
  const [status, setStatus] = useState<EventStatus>(current);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function change(next: EventStatus) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/events/${eventId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Could not change status.");
      setBusy(false);
      return;
    }
    setStatus(next);
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            disabled={busy}
            onClick={() => change(action)}
            className={`min-h-11 rounded-lg border px-3 text-xs uppercase tracking-wide disabled:opacity-50 ${
              status === action ? "border-brand bg-brand/15 text-content" : "border-border text-content-muted"
            }`}
          >
            {action}
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
