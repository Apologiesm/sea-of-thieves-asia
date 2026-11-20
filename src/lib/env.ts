/**
 * Environment access. Server-only secrets are never exported through a
 * NEXT_PUBLIC_ prefix and must not be imported by client components.
 */

const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.length > 0) return configured.replace(/\/$/, "");

  // Vercel provides the deployment host even before NEXT_PUBLIC_SITE_URL is
  // set, so metadata and OAuth redirects never fall back to localhost in
  // production. Preview deploys use their own host; production uses the
  // stable project domain.
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost.replace(/\/$/, "")}`;

  return LOCAL_SITE_URL;
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

