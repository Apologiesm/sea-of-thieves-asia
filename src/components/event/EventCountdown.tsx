"use client";

import { useEffect, useState } from "react";
import { useTimeZone } from "@/components/system/time-zone-provider";
import { timeZoneLabel } from "@/lib/time/zone";

type Props = {
  startsAt: string;
  endsAt?: string | null;
  cancelled?: boolean;
};

type Phase = "pending" | "waiting" | "started" | "live" | "ended" | "cancelled";

function parts(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

const DEFAULT_DURATION_MS = 4 * 60 * 60 * 1000;

/**
 * Counts down to the real UTC start, then reports live, then finished.
 * Uses the wall clock but recomputes from `Date.now()` on every tick, so a
 * suspended background tab recovers correctly instead of drifting.
 */
export function EventCountdown({ startsAt, endsAt, cancelled = false }: Props) {
  const { timeZone } = useTimeZone();
  const [state, setState] = useState<{ phase: Phase; label: string }>({
    phase: "pending",
    label: "",
  });

  useEffect(() => {
    const start = new Date(startsAt).getTime();
    const parsedEnd = endsAt ? new Date(endsAt).getTime() : null;
    const end =
      parsedEnd && Number.isFinite(parsedEnd) && parsedEnd > start
        ? parsedEnd
        : start + DEFAULT_DURATION_MS;

    const tick = () => {
      if (!Number.isFinite(start)) {
        setState({ phase: "ended", label: "Time to be announced" });
        return;
      }
      if (cancelled) {
        setState({ phase: "cancelled", label: "Cancelled" });
        return;
      }
      const now = Date.now();
      if (now >= end) {
        setState({ phase: "ended", label: "Finished" });
        return;
      }
      if (now >= start) {
        setState({ phase: "live", label: "Live now" });
        return;
      }
      const value = parts(start);
      setState({
        phase: "waiting",
        label: `${value.days}d ${String(value.hours).padStart(2, "0")}h ${String(
          value.minutes,
        ).padStart(2, "0")}m ${String(value.seconds).padStart(2, "0")}s`,
      });
    };

    const frame = requestAnimationFrame(tick);
    const timer = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [startsAt, endsAt, cancelled]);

  const started = state.phase === "live" || state.phase === "ended";

  return (
    <div className="countdown" aria-live="off">
      <span className="countdown__label">
        {state.phase === "live" ? "Status" : state.phase === "ended" ? "Status" : "Starts in"}
      </span>
      <span
        className={
          started
            ? "countdown__value countdown__value--started"
            : "countdown__value"
        }
      >
        {state.label || "\u00a0"}
      </span>
      <span className="countdown__zone">{timeZoneLabel(timeZone)}</span>
    </div>
  );
}
