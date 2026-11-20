"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { CrewListing } from "@/lib/crew/types";

type QueueItem = {
  id: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listing: CrewListing | null;
};

export function ModerationQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/moderation/crew")
      .then(async (response) => {
        const result = (await response.json()) as { reports?: QueueItem[]; error?: string };
        if (!active) return;
        if (!response.ok) setError(result.error ?? "Could not load the queue.");
        else setItems(result.reports ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("Could not load the queue.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function act(reportId: string, action: "hide" | "remove" | "restore") {
    setError(null);
    const response = await fetch("/api/moderation/crew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action, note: "" }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Action failed.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== reportId));
  }

  if (loading) return <p className="text-sm text-content-muted">Loading queue…</p>;
  if (error) return <p role="alert" className="text-sm text-red-300">{error}</p>;
  if (items.length === 0) {
    return <p className="text-sm text-content-muted">No open crew listing reports.</p>;
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-content">
                {item.listing?.title ?? "Listing unavailable"}
              </p>
              <p className="mt-1 text-xs text-content-muted">
                Reason: {item.reason} · {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-brand">{item.status}</span>
          </div>
          {item.details ? (
            <p className="mt-3 text-sm leading-relaxed text-content-muted">{item.details}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => act(item.id, "hide")}
              className="min-h-11 rounded-lg border border-border px-4 text-sm text-content hover:border-brand"
            >
              Hide listing
            </button>
            <button
              type="button"
              onClick={() => act(item.id, "remove")}
              className="min-h-11 rounded-lg border border-red-400/60 px-4 text-sm text-red-300 hover:bg-red-500/10"
            >
              Remove listing
            </button>
            <button
              type="button"
              onClick={() => act(item.id, "restore")}
              className="min-h-11 rounded-lg border border-border px-4 text-sm text-content-muted hover:text-content"
            >
              Dismiss report
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
