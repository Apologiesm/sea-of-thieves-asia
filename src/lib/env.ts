/**
 * Environment access. Server-only secrets are never exported through a
 * NEXT_PUBLIC_ prefix and must not be imported by client components.
 */

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  return value && value.length > 0 ? value.replace(/\/$/, "") : DEFAULT_SITE_URL;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

/** Public Supabase values. Safe for both server and browser clients. */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Server-only service role key access. Call this only from server code.
 * It is never included in a client bundle because it has no NEXT_PUBLIC_ prefix.
 */
export function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}
