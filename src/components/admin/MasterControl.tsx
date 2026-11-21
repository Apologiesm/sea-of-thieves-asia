"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPasteUploader } from "@/components/MediaPasteUploader";
import {
  CONTENT_TYPE_LIST,
  CONTENT_TYPES,
  type ContentType,
  type FieldSpec,
} from "@/lib/admin/content";
import type { KillSwitches, LayoutConfig } from "@/lib/site/layout";

type Row = Record<string, unknown> & { id: string };

const HOME_SECTION_LABELS: Record<string, string> = {
  horizon: "Horizon scene",
  fleet: "Fleet scene",
  tavern: "Tavern scene",
  live: "Live seas",
  news: "Official updates",
  discord: "Discord feed",
  about: "About",
  features: "Voyage features",
  previews: "Section previews",
  join: "Join CTA",
};

const KILL_SWITCH_LABELS: Array<{ key: keyof KillSwitches; label: string; desc: string }> = [
  { key: "maintenanceMode", label: "Maintenance mode", desc: "Hides all public community sections behind a maintenance notice." },
  { key: "crewSubmissions", label: "Crew LFG submissions", desc: "Allow members to create new crew listings." },
  { key: "galleryUploads", label: "Gallery uploads", desc: "Allow members to upload to the gallery." },
  { key: "officialSync", label: "Official SoT auto-sync", desc: "Allow the hourly official news sync to run." },
  { key: "discordAutoPost", label: "Discord webhook auto-post", desc: "Post new content to Discord automatically." },
];

function rowTitle(type: ContentType, row: Row): string {
  const spec = CONTENT_TYPES[type];
  const column = spec.titleColumn;
  const value = column ? row[column] : null;
  if (typeof value === "string" && value.trim()) return value.slice(0, 80);
  return `${spec.label} ${row.id.slice(0, 8)}`;
}

export function MasterControl({ initialLayout }: { initialLayout: LayoutConfig }) {
  const router = useRouter();
  const [layout, setLayout] = useState(initialLayout);
  const [tab, setTab] = useState<"layout" | ContentType>("layout");
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const loadItems = useCallback(async (type: ContentType) => {
    setLoading(true);
    setSelected(new Set());
    const response = await fetch(`/api/admin/content?type=${type}`, { cache: "no-store" });
    const result = (await response.json().catch(() => ({}))) as { items?: Row[]; error?: string };
    setItems(result.items ?? []);
    if (!response.ok) setMessage(result.error ?? "Could not load items.");
    setLoading(false);
  }, []);

  async function saveLayout(next: LayoutConfig) {
    setLayout(next);
    setBusy(true);
    const response = await fetch("/api/admin/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        home: next.home,
        killSwitches: next.killSwitches,
        nav: next.nav,
      }),
    });
    setMessage(response.ok ? "Layout saved." : "Could not save layout.");
    setBusy(false);
    router.refresh();
  }

  function moveSection(index: number, direction: -1 | 1) {
    const order = [...layout.home.order];
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    void saveLayout({ ...layout, home: { ...layout.home, order } });
  }

  function toggleSectionHidden(key: string) {
    const hidden = layout.home.hidden.includes(key)
      ? layout.home.hidden.filter((entry) => entry !== key)
      : [...layout.home.hidden, key];
    void saveLayout({ ...layout, home: { ...layout.home, hidden } });
  }

  function toggleKillSwitch(key: keyof KillSwitches) {
    void saveLayout({
      ...layout,
      killSwitches: { ...layout.killSwitches, [key]: !layout.killSwitches[key] },
    });
  }

  async function patchItem(type: ContentType, id: string, patch: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, patch }),
    });
    const result = (await response.json().catch(() => ({}))) as { item?: Row; error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Could not save that item.");
    } else if (result.item) {
      setItems((current) => current.map((row) => (row.id === id ? { ...row, ...result.item } : row)));
      setMessage("Saved.");
    }
    setBusy(false);
  }

  async function deleteItem(type: ContentType, row: Row) {
    if (!window.confirm(`Permanently delete "${rowTitle(type, row)}"? This cannot be undone.`)) return;
    setBusy(true);
    const response = await fetch(
      `/api/admin/content?type=${type}&id=${encodeURIComponent(row.id)}`,
      { method: "DELETE" },
    );
    setMessage(response.ok ? "Deleted." : "Could not delete that item.");
    setBusy(false);
    if (response.ok) setItems((current) => current.filter((entry) => entry.id !== row.id));
  }

  async function bulk(action: "delete" | "enable" | "disable" | "feature" | "unfeature") {
    if (tab === "layout" || selected.size === 0) return;
    const ids = [...selected];
    setBusy(true);
    const request =
      action === "delete"
        ? { type: tab, ids, action: "delete" as const }
        : {
            type: tab,
            ids,
            patch: {
              is_enabled: action === "enable" ? true : action === "disable" ? false : undefined,
              is_featured: action === "feature" ? true : action === "unfeature" ? false : undefined,
            },
          };
    if (action !== "delete") {
      const patch = (request as { patch: Record<string, unknown> }).patch;
      Object.keys(patch).forEach((key) => patch[key] === undefined && delete patch[key]);
    }
    if (action === "delete" && !window.confirm(`Delete ${ids.length} item(s)? This cannot be undone.`)) {
      setBusy(false);
      return;
    }
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    setMessage(response.ok ? `Updated ${ids.length} item(s).` : "Bulk action failed.");
    setBusy(false);
    if (response.ok) {
      if (action === "delete") setItems((current) => current.filter((row) => !selected.has(row.id)));
      else await loadItems(tab);
      setSelected(new Set());
    }
  }

  async function moveItem(type: ContentType, index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const current = items[index];
    const other = items[target];
    const a = typeof current.sort_order === "number" ? current.sort_order : index;
    const b = typeof other.sort_order === "number" ? other.sort_order : target;
    // Swap positions, falling back to index-derived values when both are 0.
    const first = a === b ? index : a;
    const second = a === b ? target : b;
    await patchItem(type, current.id, { sort_order: second });
    await patchItem(type, other.id, { sort_order: first });
    await loadItems(type);
  }

  const editingSpec = useMemo(
    () => (tab === "layout" ? null : CONTENT_TYPES[tab]),
    [tab],
  );

  function openEditor(row: Row) {
    setEditing(row);
    setDraft({ ...row });
  }

  async function saveEditor() {
    if (!editing || tab === "layout" || !editingSpec) return;
    const patch: Record<string, unknown> = {};
    Object.values(editingSpec.fields).forEach((field) => {
      if (!field) return;
      const key = field.column;
      if (!(key in draft)) return;
      patch[key] = draft[key];
    });
    await patchItem(tab, editing.id, patch);
    setEditing(null);
    await loadItems(tab);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Master control sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "layout"}
          onClick={() => setTab("layout")}
          className={`control-button ${tab === "layout" ? "control-button--active" : ""}`}
        >
          Layout & switches
        </button>
        {CONTENT_TYPE_LIST.map((spec) => (
          <button
            key={spec.type}
            type="button"
            role="tab"
            aria-selected={tab === spec.type}
            onClick={() => {
            setTab(spec.type);
            void loadItems(spec.type);
          }}
            className={`control-button ${tab === spec.type ? "control-button--active" : ""}`}
          >
            {spec.label}
          </button>
        ))}
      </div>

      {message ? <p role="status" className="text-sm text-brand">{message}</p> : null}

      {tab === "layout" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="control-section">
            <h2 className="text-xl font-semibold text-content">Homepage sections</h2>
            <p className="mt-1 text-sm text-content-muted">
              Reorder or hide homepage blocks. Changes apply on the next page load.
            </p>
            <div className="mt-5 grid gap-2">
              {layout.home.order.map((key, index) => {
                const hidden = layout.home.hidden.includes(key);
                return (
                  <div key={key} className="control-row">
                    <span>
                      <strong>{HOME_SECTION_LABELS[key] ?? key}</strong>
                      <small>{hidden ? "hidden" : "visible"} · position {index + 1}</small>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <button type="button" className="control-delete" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={`Move ${key} up`}>↑</button>
                      <button type="button" className="control-delete" onClick={() => moveSection(index, 1)} disabled={index === layout.home.order.length - 1} aria-label={`Move ${key} down`}>↓</button>
                      <button type="button" className="control-delete" onClick={() => toggleSectionHidden(key)}>
                        {hidden ? "Show" : "Hide"}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="control-section">
            <h2 className="text-xl font-semibold text-content">Feature kill-switches</h2>
            <p className="mt-1 text-sm text-content-muted">Master toggles applied site-wide in real time.</p>
            <div className="mt-5 grid gap-2">
              {KILL_SWITCH_LABELS.map((entry) => (
                <label key={entry.key} className="control-row">
                  <input
                    type="checkbox"
                    checked={layout.killSwitches[entry.key]}
                    onChange={() => toggleKillSwitch(entry.key)}
                  />
                  <span>
                    <strong>{entry.label}</strong>
                    <small>{entry.desc}</small>
                  </span>
                </label>
              ))}
            </div>
            {busy ? <p className="mt-3 text-xs text-content-muted">Saving…</p> : null}
          </section>
        </div>
      ) : (
        <section className="control-section">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-content">{editingSpec?.label}</h2>
              <p className="mt-1 text-sm text-content-muted">
                Edit any item regardless of author, reassign authors, pin, hide or delete.
              </p>
            </div>
            <button type="button" className="control-button" onClick={() => loadItems(tab)} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {selected.size > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-content-muted">{selected.size} selected</span>
              <button type="button" className="control-delete" onClick={() => bulk("enable")}>Publish</button>
              <button type="button" className="control-delete" onClick={() => bulk("disable")}>Unpublish</button>
              <button type="button" className="control-delete" onClick={() => bulk("feature")}>Feature</button>
              <button type="button" className="control-delete" onClick={() => bulk("unfeature")}>Unfeature</button>
              <button type="button" className="control-delete" onClick={() => bulk("delete")}>Delete</button>
            </div>
          ) : null}

          <div className="mt-5 grid gap-2">
            {loading ? (
              <p className="text-sm text-content-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-content-muted">No items of this type yet.</p>
            ) : (
              items.map((row, index) => (
                <div key={row.id} className="control-row">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={(event) => {
                        setSelected((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          return next;
                        });
                      }}
                      aria-label={`Select ${rowTitle(tab, row)}`}
                    />
                    <span>
                      <strong>{rowTitle(tab, row)}</strong>
                      <small>
                        {[
                          typeof row.status === "string" ? row.status : null,
                          row.is_enabled === false ? "hidden" : "visible",
                          row.is_featured ? "featured" : null,
                          row.pinned ? "pinned" : null,
                          typeof row.sort_order === "number" ? `order ${row.sort_order}` : null,
                        ].filter(Boolean).join(" · ") || "—"}
                      </small>
                    </span>
                  </label>
                  <span className="flex flex-wrap gap-2">
                    <button type="button" className="control-delete" onClick={() => moveItem(tab, index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                    <button type="button" className="control-delete" onClick={() => moveItem(tab, index, 1)} disabled={index === items.length - 1} aria-label="Move down">↓</button>
                    <button type="button" className="control-delete" onClick={() => openEditor(row)}>Edit</button>
                    <button type="button" className="control-delete" onClick={() => patchItem(tab, row.id, { is_enabled: row.is_enabled === false })}>
                      {row.is_enabled === false ? "Publish" : "Unpublish"}
                    </button>
                    <button type="button" className="control-delete" onClick={() => patchItem(tab, row.id, { is_featured: !row.is_featured })}>
                      {row.is_featured ? "Unfeature" : "Feature"}
                    </button>
                    <button type="button" className="control-delete" onClick={() => deleteItem(tab, row)}>Delete</button>
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {editing && editingSpec ? (
        <div className="control-section" role="dialog" aria-modal="false" aria-label={`Edit ${editingSpec.label}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-content">Edit: {rowTitle(tab as ContentType, editing)}</h2>
            <button type="button" className="control-delete" onClick={() => setEditing(null)}>Close</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(Object.values(editingSpec.fields) as FieldSpec[]).map((field) => {
              const value = draft[field.column];
              if (field.kind === "image") {
                return (
                  <div key={field.column} className="sm:col-span-2">
                    <MediaPasteUploader
                      label={field.label}
                      hint="Paste (Ctrl+V), drag and drop, or pick an image. Stored as a Storage URL."
                      value={typeof value === "string" ? value : null}
                      onChange={(url) => setDraft((current) => ({ ...current, [field.column]: url }))}
                    />
                  </div>
                );
              }
              if (field.kind === "boolean") {
                return (
                  <label key={field.column} className="control-row">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => setDraft((current) => ({ ...current, [field.column]: event.target.checked }))}
                    />
                    <span><strong>{field.label}</strong></span>
                  </label>
                );
              }
              if (field.kind === "textarea") {
                return (
                  <label key={field.column} className="control-field sm:col-span-2">
                    <span>{field.label}</span>
                    <textarea
                      rows={5}
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => setDraft((current) => ({ ...current, [field.column]: event.target.value }))}
                    />
                  </label>
                );
              }
              if (field.kind === "select") {
                return (
                  <label key={field.column} className="control-field">
                    <span>{field.label}</span>
                    <select
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => setDraft((current) => ({ ...current, [field.column]: event.target.value }))}
                    >
                      {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                );
              }
              const inputType = field.kind === "number" ? "number" : field.kind === "datetime" ? "datetime-local" : "text";
              const display = field.kind === "tags" && Array.isArray(value) ? value.join(", ") : value;
              return (
                <label key={field.column} className="control-field">
                  <span>{field.label}{field.hint ? ` — ${field.hint}` : ""}</span>
                  <input
                    type={inputType}
                    value={typeof display === "string" || typeof display === "number" ? String(display) : ""}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.column]: event.target.value }))}
                  />
                </label>
              );
            })}
          </div>
          <button type="button" className="control-button mt-5" onClick={saveEditor} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
