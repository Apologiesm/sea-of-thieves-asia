"use client";

import { useEffect, useRef } from "react";
import { VOYAGE_STOPS, voyageStore } from "@/lib/scroll/voyage-store";

export function VoyageProgress() {
  const fillRef = useRef<HTMLSpanElement>(null);
  const dotRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const progress = voyageStore.progress;
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${progress})`;
      }
      let active = 0;
      VOYAGE_STOPS.forEach((stop, index) => {
        if (progress >= stop.at) active = index;
      });
      dotRefs.current.forEach((dot, index) => {
        dot?.classList.toggle("is-active", index === active);
      });
      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="voyage-progress" aria-hidden="true">
      <div className="voyage-progress__rail">
        <span ref={fillRef} className="voyage-progress__fill" />
      </div>
      <ol className="voyage-progress__stops">
        {VOYAGE_STOPS.map((stop, index) => (
          <li
            key={stop.label}
            ref={(element) => {
              dotRefs.current[index] = element;
            }}
          >
            <span className="voyage-progress__dot" />
            <span className="voyage-progress__label">{stop.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
