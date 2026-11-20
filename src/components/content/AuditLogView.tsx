"use client";

import { useEffect, useState } from "react";
import type { AuditRecord } from "@/lib/m8/types";

export function AuditLogView() {
  const [entries, setEntries] = useState<AuditRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/audit")
      .then(async (response) => {
        const result = (await response.json()) as { entries?: AuditRecord[]; error?: string };
        if (!active) return;
        if (!response.ok) setError(result.error ?? "Could not load audit log.");
        else setEntries(result.entries ?? []);
      })
      .catch(() => setError("Could not load audit log."));
    return () => { active = false; };
  }, []);

  if (error) return <p role="alert" className="text-sm text-red-300">{error}</p>;
  if (entries.length === 0) return <p className="text-sm text-content-muted">No sensitive actions recorded yet.</p>;

  return (
    <div className="grid gap-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-border bg-surface p-3 text-xs text-content-muted">
          <span className="font-semibold text-content">{entry.action}</span> · {entry.target_type} · {new Date(entry.created_at).toLocaleString()}
        </div>
      ))}
    </div>
  );
}
