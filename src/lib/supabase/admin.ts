import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * SERVER ONLY. This client uses the service-role key and must never be
 * imported by a Client Component or any module in a client bundle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
