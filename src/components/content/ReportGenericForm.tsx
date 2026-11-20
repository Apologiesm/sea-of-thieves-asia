"use client";

import { useState, type FormEvent } from "react";
import { REPORT_TARGETS } from "@/lib/content/site-config";

export function ReportGenericForm() {
  const [targetType, setTargetType] = useState<string>(REPORT_TARGETS[0].value);
  const [targetId, setTargetId] = useState("");
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
    if (!response.ok) setError(result.error ?? "Could not submit the report.");
    else { setDone(true); setReason(""); setDetails(""); setTargetId(""); }
    setBusy(false);
  }

  const field = "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content";
  const label = "block text-sm font-medium text-content";

  return (
    <form onSubmit={submit} className="grid gap-5">
      <label><span className={label}>What are you reporting?</span><select className={field} value={targetType} onChange={(e) => setTargetType(e.target.value)}>{REPORT_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
      <label><span className={label}>Item ID (UUID)</span><input className={field} value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" /></label>
      <label><span className={label}>Reason</span><input className={field} value={reason} maxLength={160} onChange={(e) => setReason(e.target.value)} /></label>
      <label><span className={label}>Details (optional)</span><textarea className={field} rows={4} value={details} maxLength={500} onChange={(e) => setDetails(e.target.value)} /></label>
      <button type="submit" disabled={busy || !targetId || !reason} className="inline-flex min-h-12 items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas disabled:opacity-60">{busy ? "Sending…" : "Submit report"}</button>
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
      {done ? <p className="text-sm text-content">Report submitted for private moderator review.</p> : null}
    </form>
  );
}
