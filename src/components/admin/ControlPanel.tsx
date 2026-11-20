"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/site/settings";

export type DeleteItem = { id: string; title: string; type: string };

const FEATURE_LABELS: Array<{ key: keyof SiteSettings["features"]; label: string; desc: string }> = [
  { key: "events", label: "Events", desc: "Event calendar, RSVP and hosts" },
  { key: "crew", label: "Crew finder", desc: "Listings and applications" },
  { key: "guides", label: "Guides", desc: "Player knowledge base" },
  { key: "gallery", label: "Gallery", desc: "Media uploads and moderation" },
  { key: "news", label: "News", desc: "Community announcements" },
  { key: "discordEvents", label: "Discord event board", desc: "Discord-synced events" },
];

export function ControlPanel({ initial, items }: { initial: SiteSettings; items: DeleteItem[] }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function setFeature(key: keyof SiteSettings["features"], value: boolean) {
    setSettings((current) => ({ ...current, features: { ...current.features, [key]: value } }));
  }

  function setDiscord(key: keyof SiteSettings["discord"], value: string | number | boolean) {
    setSettings((current) => ({ ...current, discord: { ...current.discord, [key]: value } }));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/control", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage(response.ok ? "Settings saved." : "Could not save settings.");
    setBusy(false);
    router.refresh();
  }

  async function remove(item: DeleteItem) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    const response = await fetch("/api/admin/control/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: item.type, id: item.id }),
    });
    setMessage(response.ok ? `Deleted ${item.title}.` : "Could not delete that item.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="control-section">
        <h2 className="text-xl font-semibold text-content">Features</h2>
        <p className="mt-1 text-sm text-content-muted">Turn sections off for maintenance. Navigation and homepage sections follow these switches.</p>
        <div className="mt-5 grid gap-2">
          {FEATURE_LABELS.map((feature) => (
            <label key={feature.key} className="control-row">
              <input
                type="checkbox"
                checked={settings.features[feature.key]}
                onChange={(e) => setFeature(feature.key, e.target.checked)}
              />
              <span>
                <strong>{feature.label}</strong>
                <small>{feature.desc}</small>
              </span>
            </label>
          ))}
        </div>

        <h2 className="mt-8 text-xl font-semibold text-content">Discord announcements</h2>
        <div className="mt-4 grid gap-3">
          <label className="control-field">
            <span>Channel link or ID</span>
            <input value={settings.discord.channelUrl} onChange={(e) => setDiscord("channelUrl", e.target.value)} placeholder="https://discord.com/channels/..." />
          </label>
          <label className="control-field">
            <span>Channel ID</span>
            <input value={settings.discord.channelId} onChange={(e) => setDiscord("channelId", e.target.value)} placeholder="Optional if link is used" />
          </label>
          <label className="control-field">
            <span>Latest posts to show</span>
            <input type="number" min={1} max={25} value={settings.discord.announcementLimit} onChange={(e) => setDiscord("announcementLimit", Number(e.target.value))} />
          </label>
          <label className="control-row">
            <input type="checkbox" checked={settings.discord.enabled} onChange={(e) => setDiscord("enabled", e.target.checked)} />
            <span><strong>Show Discord feed</strong><small>Render synced Discord announcements on the news page</small></span>
          </label>
        </div>
        <button type="button" onClick={save} disabled={busy} className="control-button">{busy ? "Saving…" : "Save settings"}</button>
        {message ? <p role="status" className="mt-3 text-sm text-brand">{message}</p> : null}
      </section>

      <section className="control-section">
        <h2 className="text-xl font-semibold text-content">Master delete</h2>
        <p className="mt-1 text-sm text-content-muted">Owner-only. Removes the item and its public card everywhere.</p>
        <div className="mt-5 grid gap-2">
          {items.length === 0 ? <p className="text-sm text-content-muted">Nothing to delete yet.</p> : items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="control-row">
              <span><strong>{item.title}</strong><small>{item.type.replace(/_/g, " ")}</small></span>
              <button type="button" onClick={() => remove(item)} className="control-delete">Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
