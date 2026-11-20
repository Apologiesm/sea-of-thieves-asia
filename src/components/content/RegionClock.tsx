"use client";

import { useEffect, useState } from "react";
import { ASIAN_TIMEZONES } from "@/lib/content/site-config";

export function RegionClock() {
  const [zone, setZone] = useState<string>("Asia/Singapore");
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      try {
        setTime(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: zone,
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(new Date()),
        );
      } catch {
        setTime("--:--");
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [zone]);

  return (
    <div className="region-clock">
      <label htmlFor="region-clock-zone">Regional time</label>
      <div className="region-clock__row">
        <select
          id="region-clock-zone"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
        >
          {ASIAN_TIMEZONES.map((item) => (
            <option key={item} value={item}>
              {item.replace("Asia/", "")}
            </option>
          ))}
        </select>
        <time suppressHydrationWarning>{time || "--:--"}</time>
      </div>
    </div>
  );
}
