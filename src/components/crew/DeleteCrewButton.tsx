"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCrewButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    setError(null);
    const response = await fetch(`/api/crew/${listingId}`, { method: "DELETE" });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Could not delete the listing.");
      setDeleting(false);
      return;
    }
    router.push("/crew");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={remove}
        disabled={deleting}
        className="min-h-11 rounded-lg border border-red-400/60 px-4 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete listing"}
      </button>
      {error ? <p role="alert" className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
