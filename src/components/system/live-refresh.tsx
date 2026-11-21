"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

/**
 * Keeps server-rendered community content current without a full page reload.
 *
 * A Supabase Realtime subscription on the public content tables triggers a
 * debounced `router.refresh()`. If Realtime is unavailable (not configured,
 * blocked by a proxy, or the socket never connects) the component falls back
 * to a slow polling refresh, so the site still updates on its own.
 */

const TABLES = [
  "events",
  "announcements",
  "crew_listings",
  "gallery_items",
  "guides",
  "official_events",
] as const;

const REALTIME_GRACE_MS = 12_000;
const POLL_MS = 120_000;

export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabase();

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        router.refresh();
      }, 1200);
    };

    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    let connected = false;

    if (supabase) {
      channel = supabase.channel("sot-community-content");
      TABLES.forEach((table) => {
        channel?.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          scheduleRefresh,
        );
      });
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") connected = true;
      });
    }

    // Polling fallback only if Realtime never came up.
    const poll = setInterval(() => {
      if (connected) return;
      if (document.visibilityState !== "visible") return;
      router.refresh();
    }, POLL_MS);

    // If the socket has not connected shortly after load, keep polling active.
    const grace = setTimeout(() => {
      connected = connected || false;
    }, REALTIME_GRACE_MS);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      clearInterval(poll);
      clearTimeout(grace);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
