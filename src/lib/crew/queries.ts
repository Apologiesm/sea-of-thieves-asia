import { createClient } from "@/lib/supabase/server";
import type { CrewFilters, CrewListing } from "@/lib/crew/types";

export async function listCrewListings(filters: CrewFilters): Promise<CrewListing[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("crew_listings")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(60);

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
  return (data ?? []) as CrewListing[];
}

export async function getCrewListing(id: string): Promise<CrewListing | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("crew_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as CrewListing;
}
