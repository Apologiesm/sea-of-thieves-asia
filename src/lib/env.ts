/**
 * Environment access. Server-only values are never exported through a
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
