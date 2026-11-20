"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ReportButton } from "@/components/content/ReportButton";
import type { CommentRecord } from "@/lib/m8/types";

export function Comments({ targetType, targetId }: { targetType: "guide" | "event"; targetId: string }) {
  const [items, setItems] = useState<CommentRecord[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`)
      .then(async (response) => {
        const result = (await response.json()) as { comments?: CommentRecord[] };
        if (active) setItems(result.comments ?? []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [targetType, targetId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, body }),
    });
    const result = (await response.json()) as { error?: string; comment?: CommentRecord };
    if (!response.ok) {
      setError(result.error ?? "Could not post comment.");
    } else if (result.comment) {
      setItems((current) => [...current, result.comment as CommentRecord]);
      setBody("");
    }
    setBusy(false);
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-content">Comments</h2>
      <p className="mt-2 text-sm text-content-muted">Comments are plain text and visible to signed-in members.</p>
      <form onSubmit={submit} className="mt-5">
        <textarea
          value={body}
          maxLength={1200}
          rows={3}
          onChange={(event) => setBody(event.target.value)}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"
          placeholder="Add a comment"
        />
        <button
          type="submit"
          disabled={busy || body.trim().length === 0}
          className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post comment"}
        </button>
        {error ? <p role="alert" className="mt-2 text-sm text-red-300">{error}</p> : null}
      </form>
      <div className="mt-6 grid gap-4">
        {items.length === 0 ? <p className="text-sm text-content-muted">No comments yet.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-card border border-border bg-surface/50 p-4">
            <p className="text-sm text-content">{item.body}</p>
            <div className="mt-3">
              <ReportButton targetType="comment" targetId={item.id} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
