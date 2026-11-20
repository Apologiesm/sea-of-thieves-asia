"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GUIDE_CATEGORIES } from "@/lib/content/site-config";
import { MediaPasteUploader } from "@/components/MediaPasteUploader";
import type { GuideRecord } from "@/lib/m8/types";

type Values = { title: string; category: string; tags: string; excerpt: string; imageUrl: string | null; body: string; status: "draft" | "published" | "archived" };
const EMPTY: Values = { title: "", category: GUIDE_CATEGORIES[0], tags: "", excerpt: "", imageUrl: null, body: "", status: "draft" };
const field = "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content";
const label = "block text-sm font-medium text-content";

export function GuideForm({ guide }: { guide?: GuideRecord }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(guide ? {
    title: guide.title,
    category: guide.category ?? GUIDE_CATEGORIES[0],
    tags: (guide.tags ?? []).join(", "),
    excerpt: guide.excerpt ?? "",
    imageUrl: guide.image_url ?? null,
    body: guide.body,
    status: (["draft", "published", "archived"].includes(guide.status) ? guide.status : "draft") as Values["status"],
  } : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch(guide ? `/api/guides/${guide.id}` : "/api/guides", {
      method: guide ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Could not save the guide.");
      setBusy(false);
      return;
    }
    router.push("/guides");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <label><span className={label}>Title</span><input className={field} value={values.title} maxLength={140} onChange={(e) => set("title", e.target.value)} /></label>
      <label><span className={label}>Category</span><select className={field} value={values.category} onChange={(e) => set("category", e.target.value)}>{GUIDE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label><span className={label}>Tags (comma separated)</span><input className={field} value={values.tags} onChange={(e) => set("tags", e.target.value)} /></label>
      <label><span className={label}>Excerpt</span><input className={field} value={values.excerpt} maxLength={240} onChange={(e) => set("excerpt", e.target.value)} /></label>
      <MediaPasteUploader
        label="Guide cover"
        hint="Optional cover image shown on the guide card. JPEG, PNG, WebP or GIF up to 5 MB."
        value={values.imageUrl}
        onChange={(url) => set("imageUrl", url)}
      />
      <label><span className={label}>Body (Markdown)</span><textarea className={field} rows={16} value={values.body} onChange={(e) => set("body", e.target.value)} /></label>
      <label><span className={label}>Status</span><select className={field} value={values.status} onChange={(e) => set("status", e.target.value as Values["status"])}><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label>
      <button type="submit" disabled={busy} className="inline-flex min-h-12 items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas disabled:opacity-60">{busy ? "Saving…" : "Save guide"}</button>
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
