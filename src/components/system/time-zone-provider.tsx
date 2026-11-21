"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TIME_ZONE,
  TIME_ZONE_COOKIE,
  resolveTimeZone,
} from "@/lib/time/zone";

type TimeZoneContextValue = {
  timeZone: string;
  setTimeZone: (value: string) => void;
};

const TimeZoneContext = createContext<TimeZoneContextValue>({
  timeZone: DEFAULT_TIME_ZONE,
  setTimeZone: () => {},
});

const STORAGE_KEY = "sot:timezone";

function persist(value: string) {
  // Cookie keeps server renders and the next request consistent;
  // localStorage is the offline/anonymous fallback.
  try {
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage can be blocked; the in-memory selection still applies.
  }
}

export function TimeZoneProvider({
  initial,
  children,
}: {
  initial: string;
  children: React.ReactNode;
}) {
  const [timeZone, setTimeZoneState] = useState(() => resolveTimeZone(initial));

  // If this device has a saved choice that the server did not see, adopt it.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (!saved) return;
    const resolved = resolveTimeZone(saved);
    if (resolved === timeZone) return;
    // Deferred so the effect never cascades a render during hydration.
    const timer = setTimeout(() => {
      persist(resolved);
      setTimeZoneState(resolved);
    }, 0);
    return () => clearTimeout(timer);
  }, [timeZone]);

  const setTimeZone = useCallback((value: string) => {
    const resolved = resolveTimeZone(value);
    persist(resolved);
    setTimeZoneState(resolved);
    // Signed-in visitors also keep the preference on their profile so it
    // follows them to another device.
    void fetch("/api/profile/timezone", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timezone: resolved }),
    }).catch(() => {});
  }, []);

  const value = useMemo(() => ({ timeZone, setTimeZone }), [timeZone, setTimeZone]);

  return <TimeZoneContext.Provider value={value}>{children}</TimeZoneContext.Provider>;
}

export function useTimeZone() {
  return useContext(TimeZoneContext);
}
