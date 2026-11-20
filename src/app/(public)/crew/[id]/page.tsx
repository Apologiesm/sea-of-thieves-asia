import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { DeleteCrewButton } from "@/components/crew/DeleteCrewButton";
import { ReportForm } from "@/components/crew/ReportForm";
import { getCrewListing } from "@/lib/crew/queries";
import { createClient } from "@/lib/supabase/server";
import { CREW_PRIVACY_NOTICE } from "@/lib/content/site-config";

export const metadata: Metadata = {
  title: "Crew listing",
  description: "Crew listing details.",
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <dt className="text-xs uppercase tracking-[0.14em] text-content-muted">{label}</dt>
      <dd className="mt-1 text-sm text-content">{value}</dd>
    </div>
  );
}

export default async function CrewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getCrewListing(id);
  if (!listing) notFound();

  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isOwner = Boolean(user && user.id === listing.author_id);

  return (
    <>
      <PageHeader
        eyebrow="Crew listing"
        title={listing.title}
        description={listing.description ?? "No description provided."}
      />
      <Container>
        <div className="grid gap-8 py-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <Badge tone="accent">{listing.status}</Badge>
                <span className="text-xs text-content-muted">
                  {listing.seats_filled}/{listing.seats_total} seats filled
                </span>
              </div>
              <dl className="mt-4">
                <Row label="Region" value={listing.region} />
                <Row label="Platform" value={listing.platform} />
                <Row label="Languages" value={(listing.languages ?? []).join(", ")} />
                <Row label="Playstyle" value={listing.playstyle} />
                <Row label="Ship preference" value={listing.ship_preference} />
                <Row label="Role preference" value={listing.role_preference} />
                <Row label="Availability" value={listing.availability} />
                <Row label="Expires" value={listing.expires_at ? new Date(listing.expires_at).toLocaleDateString() : null} />
                {listing.contact_consent ? (
                  <Row label="Contact (shared with consent)" value={listing.contact_method} />
                ) : null}
              </dl>
              {!listing.contact_consent ? (
                <p className="mt-4 text-xs text-content-muted">
                  Contact details are private. Reach the crew through the community Discord.
                </p>
              ) : null}
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card>
              <h2 className="text-base font-semibold text-content">
                {isOwner ? "Manage listing" : "Report listing"}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {isOwner ? (
                  <>
                    <Link
                      href={`/crew/${listing.id}/edit`}
                      className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas"
                    >
                      Edit listing
                    </Link>
                    <DeleteCrewButton listingId={listing.id} />
                  </>
                ) : (
                  <ReportForm listingId={listing.id} />
                )}
              </div>
            </Card>
            <p className="mt-6 text-xs leading-relaxed text-content-muted">{CREW_PRIVACY_NOTICE}</p>
          </div>
        </div>
      </Container>
    </>
  );
}
