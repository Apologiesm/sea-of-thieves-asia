"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/content/site-config";

type Person = { id: string; display_name: string | null; roles: string[] };

export function RoleManager() {
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/people")
      .then(async (response) => {
        const result = (await response.json()) as { people?: Person[]; error?: string };
        if (!active) return;
        if (!response.ok) setError(result.error ?? "Could not load members.");
        else setPeople(result.people ?? []);
      })
      .catch(() => setError("Could not load members."));
    return () => { active = false; };
  }, []);

  async function change(userId: string, role: keyof typeof ROLE_LABELS) {
    setError(null);
    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Could not change role.");
      return;
    }
    setPeople((current) => current.map((person) => person.id === userId ? { ...person, roles: [role] } : person));
  }

  if (error) return <p role="alert" className="text-sm text-red-300">{error}</p>;
  if (people.length === 0) return <p className="text-sm text-content-muted">No member profiles yet.</p>;

  return (
    <div className="grid gap-3">
      {people.map((person) => (
        <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
          <div>
            <p className="text-sm text-content">{person.display_name ?? "Unnamed member"}</p>
            <p className="text-xs text-content-muted">Current: {person.roles.join(", ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => change(person.id, role)}
                className="min-h-11 rounded-lg border border-border px-3 text-xs text-content-muted hover:text-content"
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
