import { createClient } from "@/lib/supabase/server";
import type { CrewFilters, CrewListing } from "@/lib/crew/types";

export async function listCrewListings(
  filters: CrewFilters,
  includeUnavailable = false,
): Promise<CrewListing[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  // Visitors read the public projection, which never includes contact details.
  // Management views keep the full table for their own authorized queries.
  let query = supabase
    .from(includeUnavailable ? "crew_listings" : "public_crew_listings")
    .select("*")
    .eq("status", "open")
    .eq("is_enabled", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(60);

  if (!includeUnavailable) {
    // A listing that has run out of seats or passed its expiry date is not
    // open, whatever the stored status says. Filter at the database level so
    // the public pages can never show a stale crew as available.
    const nowIso = new Date().toISOString();
    query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);
  }

  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  if (filters.region) query = query.ilike("region", `%${filters.region}%`);
  if (filters.platform) query = query.ilike("platform", `%${filters.platform}%`);
  if (filters.language) query = query.contains("languages", [filters.language]);
  if (filters.playstyle) query = query.ilike("playstyle", `%${filters.playstyle}%`);
  if (filters.shipPreference) query = query.ilike("ship_preference", `%${filters.shipPreference}%`);
  if (filters.rolePreference) query = query.ilike("role_preference", `%${filters.rolePreference}%`);
  if (filters.availability) query = query.ilike("availability", `%${filters.availability}%`);

  const { data, error } = await query;
  if (error) return [];
  const listings = (data ?? []) as CrewListing[];
  if (includeUnavailable) return listings;
  // Seat availability is derived rather than stored, so it is applied here.
  return listings.filter(
    (listing) => listing.seats_filled < listing.seats_total && !hasExpired(listing.expires_at),
  );
}

function hasExpired(iso: string | null): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time <= Date.now();
}

export async function getCrewListing(id: string): Promise<CrewListing | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("public_crew_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    // Not public any more. The author and staff can still open it.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: own } = await supabase
      .from("crew_listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return own ? (own as CrewListing) : null;
  }

  const listing: CrewListing = {
    ...(data as CrewListing),
    contact_consent: false,
    contact_method: null,
  };

  // Consented contact details are visible to signed-in members only.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: contact } = await supabase
      .from("crew_listings")
      .select("contact_consent, contact_method")
      .eq("id", id)
      .maybeSingle();
    if (contact?.contact_consent) {
      listing.contact_consent = true;
      listing.contact_method = contact.contact_method;
    }
  }

  return listing;
}
