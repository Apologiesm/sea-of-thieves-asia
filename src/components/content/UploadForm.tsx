"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GALLERY_ACCEPTED_TYPES } from "@/lib/content/site-config";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose an image or video first.");
      return;
    }
    if (!GALLERY_ACCEPTED_TYPES.includes(file.type as (typeof GALLERY_ACCEPTED_TYPES)[number])) {
      setError("Unsupported file type.");
      return;
    }

    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    body.append("caption", caption);
    body.append("altText", altText);

    const response = await fetch("/api/gallery", { method: "POST", body });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Upload failed.");
      setBusy(false);
      return;
    }
    router.push("/gallery");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <label>
        <span className="text-sm font-medium text-content">Image or video</span>
        <input
          type="file"
          accept={GALLERY_ACCEPTED_TYPES.join(",")}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-content-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-4 file:py-2 file:text-sm file:text-content"
        />
      </label>
      <label>
        <span className="text-sm font-medium text-content">Caption</span>
        <input
          value={caption}
          maxLength={240}
          onChange={(event) => setCaption(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"
        />
      </label>
      <label>
        <span className="text-sm font-medium text-content">Alt text (required for accessibility)</span>
        <input
          value={altText}
          maxLength={250}
          onChange={(event) => setAltText(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"
        />
      </label>
      <p className="text-xs text-content-muted">Images up to 10 MB, videos up to 50 MB. Uploads are private until approved by a moderator.</p>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload to gallery"}
      </button>
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
