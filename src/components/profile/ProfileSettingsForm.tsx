"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  EMPTY_EDITABLE_PROFILE,
  VISIBILITIES,
  type EditableProfile,
  type Visibility,
} from "@/lib/profile";

type Props = { initial?: EditableProfile };

const fieldClass =
  "mt-2 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content outline-none focus:border-brand";
const labelClass = "block text-sm font-medium text-content";

export function ProfileSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<EditableProfile>(initial ?? EMPTY_EDITABLE_PROFILE);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  function set<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Could not save your profile.");
    } else {
      setStatus("Saved. Your visibility settings are now active.");
      router.refresh();
    }
    setSaving(false);
  }

  async function removeAccount() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError(null);

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: confirmText }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Could not delete your account.");
      setDeleting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={save} className="grid gap-6 lg:col-span-2">
        <Card>
          <h2 className="text-lg font-semibold text-content">Profile details</h2>
          <p className="mt-2 text-sm text-content-muted">
            All fields are optional. Leave anything blank to keep it private.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Display name</span>
              <input
                className={fieldClass}
                value={form.display_name}
                maxLength={64}
                onChange={(event) => set("display_name", event.target.value)}
              />
            </label>
            <label>
              <span className={labelClass}>Region</span>
              <input
                className={fieldClass}
                value={form.region}
                maxLength={80}
                placeholder="e.g. Southeast Asia"
                onChange={(event) => set("region", event.target.value)}
              />
            </label>
            <label>
              <span className={labelClass}>Languages (comma separated)</span>
              <input
                className={fieldClass}
                value={form.languages}
                placeholder="English, Bahasa Indonesia"
                onChange={(event) => set("languages", event.target.value)}
              />
            </label>
            <label>
              <span className={labelClass}>Platform</span>
              <input
                className={fieldClass}
                value={form.platform}
                maxLength={80}
                onChange={(event) => set("platform", event.target.value)}
              />
            </label>
            <label>
              <span className={labelClass}>Playstyle</span>
              <input
                className={fieldClass}
                value={form.playstyle}
                maxLength={80}
                onChange={(event) => set("playstyle", event.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Bio</span>
              <textarea
                className={fieldClass}
                rows={4}
                maxLength={500}
                value={form.bio}
                onChange={(event) => set("bio", event.target.value)}
              />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-content">
            Optional social links
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Website</span>
              <input
                className={fieldClass}
                value={form.socialWebsite}
                placeholder="https://"
                onChange={(event) => set("socialWebsite", event.target.value)}
              />
            </label>
            <label>
              <span className={labelClass}>X</span>
              <input
                className={fieldClass}
                value={form.socialX}
                placeholder="https://"
                onChange={(event) => set("socialX", event.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>YouTube</span>
              <input
                className={fieldClass}
                value={form.socialYoutube}
                placeholder="https://"
                onChange={(event) => set("socialYoutube", event.target.value)}
              />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-content">Crew information</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Crew name</span>
              <input
                className={fieldClass}
                value={form.crewName}
                maxLength={80}
                onChange={(event) => set("crewName", event.target.value)}
              />
            </label>
            <label>
              <span className={labelClass}>Your role</span>
              <input
                className={fieldClass}
                value={form.crewRole}
                maxLength={80}
                onChange={(event) => set("crewRole", event.target.value)}
              />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-content">Profile visibility</h2>
          <p className="mt-2 text-sm text-content-muted">
            Private is the default. Only profiles you mark public are discoverable.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {VISIBILITIES.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4"
              >
                <input
                  type="radio"
                  name="visibility"
                  className="mt-1"
                  checked={form.visibility === option}
                  onChange={() => set("visibility", option as Visibility)}
                />
                <span>
                  <span className="block text-sm font-semibold text-content">
                    {option === "private"
                      ? "Only me"
                      : option === "members"
                        ? "Signed-in members"
                        : "Everyone"}
                  </span>
                  <span className="mt-1 block text-xs text-content-muted">
                    {option === "private"
                      ? "No other member can see your profile."
                      : option === "members"
                        ? "Visible to members who are signed in."
                        : "Visible to anyone, including visitors."}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {status ? <p className="mt-3 text-sm text-content">{status}</p> : null}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </form>

      <div className="space-y-6">
        <Card>
          <Badge tone="accent">PRIVACY</Badge>
          <h2 className="mt-4 text-lg font-semibold text-content">
            Your data stays yours
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-content-muted">
            <li>We never request Discord message contents.</li>
            <li>We never request server or guild lists.</li>
            <li>Your Discord ID and email are never shown publicly.</li>
            <li>You can edit or delete your data at any time.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-content">Delete account</h2>
          <p className="mt-3 text-sm leading-relaxed text-content-muted">
            This permanently removes your profile and signs you out. Type DELETE
            to confirm.
          </p>
          <input
            className={fieldClass}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="Type DELETE"
            aria-label="Type DELETE to confirm account deletion"
          />
          <button
            type="button"
            onClick={removeAccount}
            disabled={confirmText !== "DELETE" || deleting}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Permanently delete my account"}
          </button>
        </Card>
      </div>
    </div>
  );
}
