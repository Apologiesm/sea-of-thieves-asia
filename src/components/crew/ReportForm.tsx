"use client";

import { useState, type FormEvent } from "react";

export function ReportForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setStatus(null);

    const response = await fetch(`/api/crew/${listingId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(result.error ?? "Could not submit the report.");
    } else {
      setStatus("Report submitted for review. Thank you.");
      setOpen(false);
      setReason("");
      setDetails("");
    }
    setSending(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-lg border border-border px-4 text-sm text-content-muted hover:text-content"
      >
        Report listing
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-border bg-surface/60 p-5">
      <h3 className="text-base font-semibold text-content">Report this listing</h3>
      <label className="mt-4 block">
        <span className="text-sm text-content">Reason</span>
        <input
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"
          value={reason}
          maxLength={160}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <label className="mt-3 block">
        <span className="text-sm text-content">Details (optional)</span>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"
          rows={3}
          value={details}
          maxLength={500}
          onChange={(event) => setDetails(event.target.value)}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={sending || reason.trim().length === 0}
          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          {sending ? "Sending…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-11 items-center px-3 text-sm text-content-muted underline underline-offset-4"
        >
          Cancel
        </button>
      </div>
      {status ? <p className="mt-3 text-sm text-content">{status}</p> : null}
    </form>
  );
}
