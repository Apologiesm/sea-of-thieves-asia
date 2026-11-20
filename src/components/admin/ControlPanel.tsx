"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/site/settings";
import { SortableList, type SortableItem } from "@/components/admin/SortableList";

export type DeleteItem = { id: string; title: string; type: string };

const SECTION_ITEMS: SortableItem[] = [
  { id: "live", title: "Live seas", subtitle: "Current and upcoming events", avatar: "LS" },
  { id: "news", title: "Official updates", subtitle: "News from Sea of Thieves", avatar: "ON" },
  { id: "discord", title: "Discord feed", subtitle: "Community announcements", avatar: "DF" },
  { id: "about", title: "About", subtitle: "What this community is for", avatar: "AB" },
  { id: "features", title: "Voyage features", subtitle: "Crew, events, guides, gallery", avatar: "VF" },
  { id: "previews", title: "Section previews", subtitle: "Public section empty states", avatar: "SP" },
  { id: "join", title: "Join CTA", subtitle: "Discord invite", avatar: "JC" },
];

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

  function setDiscordEnabled(value: boolean) {
    setSettings((current) => ({ ...current, discord: { ...current.discord, enabled: value } }));
  }

  function setHomeOrder(sectionOrder: string[]) {
    setSettings((current) => ({ ...current, home: { ...current.home, sectionOrder } }));
  }

  function setChannel(index: number, key: "label" | "url" | "id" | "limit", value: string | number) {
    setSettings((current) => ({
      ...current,
      discord: {
        ...current.discord,
        channels: current.discord.channels.map((channel, channelIndex) =>
          channelIndex === index ? { ...channel, [key]: value } : channel,
        ),
      },
    }));
  }

  function addChannel() {
    setSettings((current) => ({
      ...current,
      discord: {
        ...current.discord,
        channels: [
          ...current.discord.channels,
          { key: `channel-${Date.now()}`, label: "New channel", url: "", id: "", limit: 4 },
        ],
      },
    }));
  }

  function removeChannel(index: number) {
    setSettings((current) => ({
      ...current,
      discord: { ...current.discord, channels: current.discord.channels.filter((_, channelIndex) => channelIndex !== index) },
    }));
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
    <div className="grid gap-6">
      <section className="control-section">
        <h2 className="text-xl font-semibold text-content">Homepage section order</h2>
        <p className="mt-1 text-sm text-content-muted">Drag a card to reorder the homepage. Keyboard: Alt + Up / Down.</p>
        <div className="mt-5">
          <SortableList
            items={SECTION_ITEMS}
            order={settings.home.sectionOrder}
            onChange={setHomeOrder}
          />
        </div>
      </section>

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
          <label className="control-row">
            <input type="checkbox" checked={settings.discord.enabled} onChange={(e) => setDiscordEnabled(e.target.checked)} />
            <span><strong>Show Discord feeds</strong><small>Render synced Discord announcements on the news page</small></span>
          </label>
          {settings.discord.channels.map((channel, index) => (
            <div key={channel.key} className="control-channel">
              <div className="control-channel__head">
                <strong>{channel.label || `Channel ${index + 1}`}</strong>
                <button type="button" onClick={() => removeChannel(index)} className="control-delete">Remove</button>
              </div>
              <label className="control-field"><span>Label</span><input value={channel.label} onChange={(e) => setChannel(index, "label", e.target.value)} /></label>
              <label className="control-field"><span>Channel link</span><input value={channel.url} onChange={(e) => setChannel(index, "url", e.target.value)} placeholder="https://discord.com/channels/..." /></label>
              <label className="control-field"><span>Channel ID</span><input value={channel.id} onChange={(e) => setChannel(index, "id", e.target.value)} placeholder="Optional if link is used" /></label>
              <label className="control-field"><span>Latest posts</span><input type="number" min={1} max={25} value={channel.limit} onChange={(e) => setChannel(index, "limit", Number(e.target.value))} /></label>
            </div>
          ))}
          <button type="button" onClick={addChannel} className="control-button">Add channel</button>
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
    </div>
  );
}
