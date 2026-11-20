import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * SERVER ONLY. Importing this module from a Client Component fails the build.
 * The service-role key is read only here and never via a NEXT_PUBLIC_ variable.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
