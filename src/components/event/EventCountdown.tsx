"use client";

import { useEffect, useState } from "react";

type Props = { startsAt: string; timeZone?: string | null };

function parts(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function EventCountdown({ startsAt, timeZone }: Props) {
  const [label, setLabel] = useState<string>("—");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const target = new Date(startsAt).getTime();
    const tick = () => {
      if (Number.isNaN(target)) {
        setLabel("Time to be announced");
        return;
      }
      if (target <= Date.now()) {
        setStarted(true);
        setLabel("Event started");
        return;
      }
      const value = parts(target);
      setLabel(
        `${value.days}d ${String(value.hours).padStart(2, "0")}h ${String(value.minutes).padStart(2, "0")}m ${String(value.seconds).padStart(2, "0")}s`,
      );
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startsAt]);

  return (
    <div className="countdown" aria-live="off">
      <span className="countdown__label">Starts in</span>
      <span className={started ? "countdown__value countdown__value--started" : "countdown__value"}>
        {label}
      </span>
      {timeZone ? <span className="countdown__zone">{timeZone.replace("Asia/", "")}</span> : null}
    </div>
  );
}
