"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";

/** Browser client. Only NEXT_PUBLIC_ values are ever read here. */
export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  return createBrowserClient(env.url, env.anonKey);
}
