"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { GalleryItem } from "@/lib/m8/types";

export function GalleryModeration() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/gallery?all=1")
      .then(async (response) => {
        const result = (await response.json()) as { items?: GalleryItem[]; error?: string };
        if (!active) return;
        if (!response.ok) setError(result.error ?? "Could not load queue.");
        else setItems(result.items ?? []);
      })
      .catch(() => setError("Could not load queue."));
    return () => { active = false; };
  }, []);

  async function decide(id: string, status: "approved" | "rejected") {
    setError(null);
    const response = await fetch(`/api/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Action failed.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  if (error) return <p role="alert" className="text-sm text-red-300">{error}</p>;
  if (items.length === 0) return <p className="text-sm text-content-muted">No pending gallery submissions.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-card border border-border bg-surface p-4">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-canvas">
            {item.publicUrl && !/\.(mp4|webm)$/i.test(item.storage_path) ? (
              <Image src={item.publicUrl} alt={item.alt_text ?? ""} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
            ) : null}
          </div>
          <p className="mt-3 text-sm text-content">{item.caption ?? "Untitled"}</p>
          <p className="mt-1 text-xs text-content-muted">{item.alt_text}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => decide(item.id, "approved")} className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-canvas">Approve</button>
            <button type="button" onClick={() => decide(item.id, "rejected")} className="min-h-11 rounded-lg border border-red-400/60 px-4 text-sm text-red-300">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
