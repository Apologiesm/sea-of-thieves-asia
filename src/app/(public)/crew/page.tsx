import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { CrewCard } from "@/components/crew/CrewCard";
import { CrewFilters } from "@/components/crew/CrewFilters";
import { listCrewListings } from "@/lib/crew/queries";
import { crewFiltersSchema } from "@/lib/crew/validation";
import { CREW_PRIVACY_NOTICE } from "@/lib/content/site-config";

export const metadata: Metadata = {
  title: "Crew Finder",
  description: "Find a crew for your next Sea of Thieves voyage.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function flatten(params: Record<string, string | string[] | undefined>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }
  return result;
}

export default async function CrewPage({ searchParams }: { searchParams: SearchParams }) {
  const parsed = crewFiltersSchema.safeParse(flatten(await searchParams));
  const filters = parsed.success ? parsed.data : crewFiltersSchema.parse({});
  const listings = await listCrewListings(filters);

  return (
    <>
      <PageHeader
        eyebrow="Crew finder"
        title="Find your crew"
        description="Post a voyage or answer one. Listings appear when real members create them."
      />
      <Container>
        <div className="py-10 sm:py-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-content-muted">
              {listings.length} open {listings.length === 1 ? "listing" : "listings"}
            </p>
            <ButtonLink href="/crew/new">Create a listing</ButtonLink>
          </div>

          <CrewFilters filters={filters} />

          <div className="mt-8">
            {listings.length === 0 ? (
              <EmptyState
                title="No crews posted yet"
                description="No crew listings have been posted yet. Be the first to post a real voyage."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <CrewCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 rounded-card border border-border bg-surface/40 p-5">
            <h2 className="text-sm font-semibold text-content">Privacy notice</h2>
            <p className="mt-2 text-sm leading-relaxed text-content-muted">
              {CREW_PRIVACY_NOTICE}
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
