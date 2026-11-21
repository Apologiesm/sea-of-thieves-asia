"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/site/settings";
import { SortableList, type SortableItem } from "@/components/admin/SortableList";

export type DeleteItem = { id: string; title: string; type: string };

const SECTION_ITEMS: SortableItem[] = [
  { id: "horizon", title: "Horizon", subtitle: "Cinematic scene: sunrise at sea", avatar: "HZ" },
  { id: "fleet", title: "Fleet", subtitle: "Cinematic scene: galleon off the island", avatar: "FL" },
  { id: "tavern", title: "Tavern", subtitle: "Cinematic scene: lanterns after dark", avatar: "TV" },
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

export type OfficialUpdateItem = {
  external_id: string;
  title: string;
  url: string;
  featured: boolean;
  hidden: boolean;
};

export function ControlPanel({
  initial,
  items,
  officialUpdates = [],
}: {
  initial: SiteSettings;
  items: DeleteItem[];
  officialUpdates?: OfficialUpdateItem[];
}) {
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

  function setOutgoingWebhook(value: string) {
    setSettings((current) => ({ ...current, discord: { ...current.discord, outgoingWebhookUrl: value } }));
  }

  async function syncOfficial() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/sync/official-sot", { method: "POST" });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(
      response.ok
        ? "Official Sea of Thieves news synced."
        : `Sync failed: ${result.error ?? "unknown error"}`,
    );
    setBusy(false);
    router.refresh();
  }

  async function toggleOfficial(id: string, changes: { featured?: boolean; hidden?: boolean }) {
    setBusy(true);
    const response = await fetch("/api/admin/official-updates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    });
    setMessage(response.ok ? "Official update updated." : "Could not update that item.");
    setBusy(false);
    router.refresh();
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
          <label className="control-field">
            <span>Outgoing webhook URL (website → Discord posts)</span>
            <input
              value={settings.discord.outgoingWebhookUrl}
              onChange={(e) => setOutgoingWebhook(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              type="url"
            />
          </label>
          <p className="text-xs text-content-muted">
            When set, published announcements, new events and new crew listings are posted to this
            Discord channel as rich embeds automatically.
          </p>
        </div>
        <button type="button" onClick={save} disabled={busy} className="control-button">{busy ? "Saving…" : "Save settings"}</button>
        {message ? <p role="status" className="mt-3 text-sm text-brand">{message}</p> : null}
      </section>

      <section className="control-section">
        <h2 className="text-xl font-semibold text-content">Official Sea of Thieves news</h2>
        <p className="mt-1 text-sm text-content-muted">
          Pull the latest official news and season updates from seaofthieves.com, then feature or
          hide individual posts. Custom Asia events can be created from the Events page — owners,
          admins and moderators are event hosts by default.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={syncOfficial} disabled={busy} className="control-button">
            {busy ? "Syncing…" : "Sync Official SoT News Now"}
          </button>
          <span className="text-xs text-content-muted">Also runs nightly via the Vercel cron job.</span>
        </div>
        <div className="mt-5 grid gap-2">
          {officialUpdates.length === 0 ? (
            <p className="text-sm text-content-muted">No official updates synced yet.</p>
          ) : (
            officialUpdates.map((update) => (
              <div key={update.external_id} className="control-row">
                <span>
                  <strong>{update.title}</strong>
                  <small>official · {update.featured ? "featured" : "standard"}{update.hidden ? " · hidden" : ""}</small>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="control-delete"
                    onClick={() => toggleOfficial(update.external_id, { featured: !update.featured })}
                  >
                    {update.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    className="control-delete"
                    onClick={() => toggleOfficial(update.external_id, { hidden: !update.hidden })}
                  >
                    {update.hidden ? "Show" : "Hide"}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
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
