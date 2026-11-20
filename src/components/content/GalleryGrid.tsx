"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { GalleryItem } from "@/lib/m8/types";

function isVideo(path: string) {
  return /\.(mp4|webm)$/i.test(path);
}

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
            className="group overflow-hidden rounded-card border border-border bg-surface text-left"
          >
            <div className="relative aspect-video overflow-hidden bg-canvas">
              {item.publicUrl && !isVideo(item.storage_path) ? (
                <Image
                  src={item.publicUrl}
                  alt={item.alt_text ?? item.caption ?? "Community gallery image"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : item.publicUrl ? (
                <video src={item.publicUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-4">
              <p className="text-sm text-content">{item.caption ?? "Community submission"}</p>
              <p className="mt-1 line-clamp-2 text-xs text-content-muted">{item.alt_text}</p>
            </div>
          </button>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery viewer"
          onClick={() => setActive(null)}
        >
          <div className="max-h-full w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm text-content">{active.caption ?? "Community submission"}</p>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="min-h-11 rounded-lg border border-border px-4 text-sm text-content"
              >
                Close
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-card bg-black">
              {active.publicUrl && !isVideo(active.storage_path) ? (
                <Image src={active.publicUrl} alt={active.alt_text ?? ""} fill sizes="100vw" className="object-contain" />
              ) : active.publicUrl ? (
                <video src={active.publicUrl} controls autoPlay className="h-full w-full object-contain" />
              ) : null}
            </div>
            <p className="mt-3 text-sm text-content-muted">{active.alt_text}</p>
            <Link href={`/gallery/${active.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-content underline underline-offset-4">
              Open item details
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
