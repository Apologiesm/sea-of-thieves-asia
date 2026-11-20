"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GALLERY_ACCEPTED_TYPES } from "@/lib/content/site-config";
import { MediaPasteUploader } from "@/components/MediaPasteUploader";

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
      <MediaPasteUploader
        label="Image or video file"
        hint="Paste (Ctrl+V), drag and drop, or pick a file. Images up to 10 MB, videos up to 50 MB. Uploads stay private until a moderator approves them."
        value={file ? URL.createObjectURL(file) : null}
        onChange={() => setFile(null)}
        onFile={(next) => setFile(next)}
      />
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
