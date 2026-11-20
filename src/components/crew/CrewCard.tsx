import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CrewListing } from "@/lib/crew/types";

function Meta({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <p className="text-xs text-content-muted">
      <span className="font-semibold text-content">{label}:</span> {value}
    </p>
  );
}

export function CrewCard({ listing }: { listing: CrewListing }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-content">{listing.title}</h3>
        <Badge tone="accent">{listing.status}</Badge>
      </div>
      {listing.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-content-muted">
          {listing.description}
        </p>
      ) : null}
      <div className="mt-5 grid gap-1.5">
        <Meta label="Region" value={listing.region} />
        <Meta label="Platform" value={listing.platform} />
        <Meta label="Languages" value={(listing.languages ?? []).join(", ")} />
        <Meta label="Playstyle" value={listing.playstyle} />
        <Meta label="Ship" value={listing.ship_preference} />
        <Meta label="Availability" value={listing.availability} />
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-xs text-content-muted">
          {listing.seats_filled}/{listing.seats_total} seats
        </span>
        <Link
          href={`/crew/${listing.id}`}
          className="min-h-11 inline-flex items-center text-sm font-semibold text-content underline decoration-border underline-offset-4 hover:decoration-brand"
        >
          View listing →
        </Link>
      </div>
    </Card>
  );
}
