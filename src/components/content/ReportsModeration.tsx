"use client";

import { useEffect, useState } from "react";
import type { ReportRecord } from "@/lib/m8/types";

export function ReportsModeration() {
  const [items, setItems] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/reports?status=all")
      .then(async (response) => {
        const result = (await response.json()) as { reports?: ReportRecord[]; error?: string };
        if (!active) return;
        if (!response.ok) setError(result.error ?? "Could not load reports.");
        else setItems(result.reports ?? []);
      })
      .catch(() => setError("Could not load reports."));
    return () => { active = false; };
  }, []);

  async function act(id: string, status: "in_review" | "resolved" | "dismissed") {
    setError(null);
    const response = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, status, action: status === "resolved" ? "remove" : status === "dismissed" ? "reject" : "warn", note: "" }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Action failed.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  if (error) return <p role="alert" className="text-sm text-red-300">{error}</p>;
  if (items.length === 0) return <p className="text-sm text-content-muted">No reports in the queue.</p>;

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-card border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-content">{item.target_type} · {item.status}</p>
          <p className="mt-2 text-sm text-content">{item.reason}</p>
          {item.details ? <p className="mt-1 text-sm text-content-muted">{item.details}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => act(item.id, "in_review")} className="min-h-11 rounded-lg border border-border px-3 text-sm text-content">Review</button>
            <button type="button" onClick={() => act(item.id, "resolved")} className="min-h-11 rounded-lg border border-red-400/60 px-3 text-sm text-red-300">Resolve</button>
            <button type="button" onClick={() => act(item.id, "dismissed")} className="min-h-11 rounded-lg border border-border px-3 text-sm text-content-muted">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}
