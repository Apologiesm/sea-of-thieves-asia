"use client";

import { useState, type FormEvent } from "react";
import { REPORT_TARGETS } from "@/lib/content/site-config";

type Props = { targetType: string; targetId: string };

export function ReportButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, details }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Could not submit the report.");
    } else {
      setDone(true);
      setOpen(false);
    }
    setBusy(false);
  }

  const label = REPORT_TARGETS.find((target) => target.value === targetType)?.label ?? "item";

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 rounded-lg border border-border px-4 text-sm text-content-muted hover:text-content"
        >
          Report {label.toLowerCase()}
        </button>
        {done ? <p className="mt-2 text-xs text-content">Report submitted for review.</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-border bg-surface/60 p-5">
      <h3 className="text-base font-semibold text-content">Report this {label.toLowerCase()}</h3>
      <label className="mt-4 block">
        <span className="text-sm text-content">Reason</span>
        <input
          value={reason}
          maxLength={160}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-sm text-content">Details (optional)</span>
        <textarea
          value={details}
          maxLength={500}
          rows={3}
          onChange={(event) => setDetails(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || reason.trim().length === 0}
          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          {busy ? "Sending…" : "Submit report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-3 text-sm text-content-muted underline underline-offset-4">Cancel</button>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
