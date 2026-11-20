"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type ClipboardEvent as ReactClipboardEvent } from "react";

type Props = {
  /** Current public image URL, or null when empty. */
  value: string | null;
  onChange: (url: string | null) => void;
  /** Storage bucket: moderators-only covers, or member media. */
  bucket?: "covers" | "media";
  label?: string;
  hint?: string;
  /** Optional: receive the raw File instead of uploading (gallery flow). */
  onFile?: (file: File) => void;
};

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Universal image input: clipboard paste (Ctrl+V), drag-and-drop, and the
 * classic file picker — with instant preview and remove/replace. Uploads go
 * through /api/content/image and the form stores only the resulting public
 * URL, never raw base64.
 */
export function MediaPasteUploader({
  value,
  onChange,
  bucket = "media",
  label = "Image",
  hint,
  onFile,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (onFile) {
        // Gallery-style flows take the raw file and apply their own type/size rules.
        onFile(file);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only images (JPEG, PNG, WebP, GIF) can be attached here.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Image is larger than 5 MB.");
        return;
      }
      setBusy(true);
      try {
        const body = new FormData();
        body.set("file", file);
        body.set("bucket", bucket);
        const response = await fetch("/api/content/image", { method: "POST", body });
        const result = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !result.url) {
          setError(result.error ?? "Upload failed.");
        } else {
          onChange(result.url);
        }
      } catch {
        setError("Upload failed.");
      } finally {
        setBusy(false);
      }
    },
    [bucket, onChange, onFile],
  );

  // Clipboard paste: images pasted anywhere on the page while this uploader
  // is on screen are captured (standard Ctrl+V behaviour for image uploads).
  useEffect(() => {
    const onPaste = (event: globalThis.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void handleFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div ref={rootRef} className="grid gap-2">
      <span className="block text-sm font-medium text-content">{label}</span>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label}: paste, drop, or choose an image file`}
        onPaste={(event: ReactClipboardEvent<HTMLDivElement>) => {
          const file = Array.from(event.clipboardData?.items ?? [])
            .find((item) => item.kind === "file" && item.type.startsWith("image/"))
            ?.getAsFile();
          if (file) {
            event.preventDefault();
            void handleFile(file);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors ${
          dragging ? "border-brand bg-surface" : "border-border bg-canvas"
        }`}
      >
        <span className="text-content-muted">
          {busy ? "Uploading…" : "Paste (Ctrl+V), drop, or click to choose an image"}
        </span>
        {value ? (
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={`${label} preview`} className="media-paste-uploader__thumb" />
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border px-3 py-1.5 text-xs text-content hover:border-brand"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
            >
              Remove
            </button>
          </span>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      {hint && !error ? <p className="text-xs text-content-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
