"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CREW_OPTIONS } from "@/lib/content/site-config";
import type { CrewListing } from "@/lib/crew/types";

type Values = {
  title: string;
  description: string;
  region: string;
  platform: string;
  languages: string;
  playstyle: string;
  shipPreference: string;
  rolePreference: string;
  availability: string;
  seatsTotal: number;
  status: "open" | "closed";
  contactConsent: boolean;
  contactMethod: string;
  expiresAt: string;
};

const EMPTY: Values = {
  title: "",
  description: "",
  region: "",
  platform: "",
  languages: "",
  playstyle: "",
  shipPreference: "",
  rolePreference: "",
  availability: "",
  seatsTotal: 4,
  status: "open",
  contactConsent: false,
  contactMethod: "",
  expiresAt: "",
};

function fromListing(listing: CrewListing): Values {
  return {
    title: listing.title,
    description: listing.description ?? "",
    region: listing.region ?? "",
    platform: listing.platform ?? "",
    languages: (listing.languages ?? []).join(", "),
    playstyle: listing.playstyle ?? "",
    shipPreference: listing.ship_preference ?? "",
    rolePreference: listing.role_preference ?? "",
    availability: listing.availability ?? "",
    seatsTotal: listing.seats_total,
    status: listing.status === "closed" ? "closed" : "open",
    contactConsent: listing.contact_consent,
    contactMethod: listing.contact_method ?? "",
    expiresAt: listing.expires_at ? listing.expires_at.slice(0, 10) : "",
  };
}

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content outline-none focus:border-brand";
const labelClass = "block text-sm font-medium text-content";

export function CrewForm({ listing }: { listing?: CrewListing }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(listing ? fromListing(listing) : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function select(
    label: string,
    key: "region" | "platform" | "languages" | "playstyle" | "shipPreference" | "rolePreference" | "availability",
    options: readonly string[],
  ) {
    return (
      <label>
        <span className={labelClass}>{label}</span>
        <select
          className={fieldClass}
          value={values[key]}
          onChange={(event) => set(key, event.target.value)}
        >
          <option value="">Not specified</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...values,
      expiresAt: values.expiresAt ? new Date(`${values.expiresAt}T23:59:59Z`).toISOString() : null,
    };

    const response = await fetch(listing ? `/api/crew/${listing.id}` : "/api/crew", {
      method: listing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Could not save the listing.");
      setSaving(false);
      return;
    }

    router.push("/crew");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="rounded-card border border-border bg-surface/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-content">Listing details</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Title</span>
            <input
              className={fieldClass}
              value={values.title}
              maxLength={100}
              onChange={(event) => set("title", event.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Description</span>
            <textarea
              className={fieldClass}
              rows={5}
              value={values.description}
              maxLength={600}
              onChange={(event) => set("description", event.target.value)}
            />
          </label>
          {select("Region", "region", CREW_OPTIONS.regions)}
          {select("Platform", "platform", CREW_OPTIONS.platforms)}
          <label>
            <span className={labelClass}>Languages (comma separated)</span>
            <input
              className={fieldClass}
              value={values.languages}
              onChange={(event) => set("languages", event.target.value)}
            />
          </label>
          {select("Playstyle", "playstyle", CREW_OPTIONS.playstyles)}
          {select("Ship preference", "shipPreference", CREW_OPTIONS.shipPreferences)}
          {select("Role preference", "rolePreference", CREW_OPTIONS.rolePreferences)}
          {select("Availability", "availability", CREW_OPTIONS.availability)}
          <label>
            <span className={labelClass}>Seats total</span>
            <input
              type="number"
              min={1}
              max={20}
              className={fieldClass}
              value={values.seatsTotal}
              onChange={(event) => set("seatsTotal", Number(event.target.value))}
            />
          </label>
          <label>
            <span className={labelClass}>Expires (optional)</span>
            <input
              type="date"
              className={fieldClass}
              value={values.expiresAt}
              onChange={(event) => set("expiresAt", event.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Status</span>
            <select
              className={fieldClass}
              value={values.status}
              onChange={(event) => set("status", event.target.value as "open" | "closed")}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-content">Contact privacy</h2>
        <p className="mt-2 text-sm leading-relaxed text-content-muted">
          Contact details are hidden by default. They appear on your listing only if you explicitly
          agree below.
        </p>
        <label className="mt-5 flex items-start gap-3 rounded-lg border border-border p-4">
          <input
            type="checkbox"
            className="mt-1"
            checked={values.contactConsent}
            onChange={(event) => set("contactConsent", event.target.checked)}
          />
          <span className="text-sm text-content">
            I explicitly consent to showing my contact method on this public listing.
          </span>
        </label>
        {values.contactConsent ? (
          <label className="mt-4 block">
            <span className={labelClass}>Contact method</span>
            <input
              className={fieldClass}
              value={values.contactMethod}
              maxLength={200}
              placeholder="Discord username or other public contact"
              onChange={(event) => set("contactMethod", event.target.value)}
            />
          </label>
        ) : null}
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas hover:bg-brand-strong disabled:opacity-60"
        >
          {saving ? "Saving…" : listing ? "Save changes" : "Create listing"}
        </button>
        {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    </form>
  );
}
