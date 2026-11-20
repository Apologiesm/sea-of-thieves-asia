"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/content/site-config";
import type { AnnouncementRecord } from "@/lib/m8/types";

type Values = { title: string; category: string; coverImageUrl: string | null; body: string; pinned: boolean; status: "draft" | "published" | "archived" };
const EMPTY: Values = { title: "", category: ANNOUNCEMENT_CATEGORIES[0], coverImageUrl: null, body: "", pinned: false, status: "draft" };
const field = "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content";
const label = "block text-sm font-medium text-content";

export function AnnouncementForm({ announcement }: { announcement?: AnnouncementRecord }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(announcement ? {
    title: announcement.title,
    category: announcement.category ?? ANNOUNCEMENT_CATEGORIES[0],
    coverImageUrl: announcement.cover_image_url ?? null,
    body: announcement.body,
    pinned: announcement.pinned,
    status: (["draft", "published", "archived"].includes(announcement.status) ? announcement.status : "draft") as Values["status"],
  } : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function uploadCover(file: File) {
    setUploadingCover(true);
    setError(null);
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/content/image", { method: "POST", body: data });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !result.url) setError(result.error ?? "Could not upload the cover image.");
    else set("coverImageUrl", result.url);
    setUploadingCover(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch(announcement ? `/api/announcements/${announcement.id}` : "/api/announcements", {
      method: announcement ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Could not save the announcement.");
      setBusy(false);
      return;
    }
    router.push("/announcements");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <label><span className={label}>Title</span><input className={field} value={values.title} maxLength={140} onChange={(e) => set("title", e.target.value)} /></label>
      <label><span className={label}>Category</span><select className={field} value={values.category} onChange={(e) => set("category", e.target.value)}>{ANNOUNCEMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <div className="cover-input">
        <span className={label}>Cover image</span>
        <div className="cover-input__row">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadCover(file);
            }}
          />
          {uploadingCover ? <span className="text-sm text-content-muted">Uploading…</span> : null}
          {values.coverImageUrl ? (
            <button type="button" className="text-sm text-content underline" onClick={() => set("coverImageUrl", null)}>Remove</button>
          ) : null}
        </div>
        {values.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.coverImageUrl} alt="Announcement cover preview" className="cover-input__preview" />
        ) : null}
      </div>
      <label><span className={label}>Body (Markdown)</span><textarea className={field} rows={12} value={values.body} onChange={(e) => set("body", e.target.value)} /></label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={values.pinned} onChange={(e) => set("pinned", e.target.checked)} /><span className={label}>Pin this announcement</span></label>
      <label><span className={label}>Status</span><select className={field} value={values.status} onChange={(e) => set("status", e.target.value as Values["status"])}><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label>
      <button type="submit" disabled={busy} className="inline-flex min-h-12 items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas disabled:opacity-60">{busy ? "Saving…" : "Save announcement"}</button>
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
