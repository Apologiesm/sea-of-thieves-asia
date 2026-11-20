"use client";

import { useEffect, useRef, type ReactNode } from "react";

type DemoCursor = {
  at?: (...args: unknown[]) => void;
  hide?: () => void;
};

type Props = {
  children: ReactNode;
  className?: string;
  cardClassName?: string;
};

const MAX_TILT = 32;
const LERP = 0.16;
const RESET_MS = 1000;

export function TiltCard({ children, className = "", cardClassName = "" }: Props) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tilt = tiltRef.current;
    const card = cardRef.current;
    if (!tilt || !card) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const insidePopup = Boolean(tilt.closest('[role="dialog"], dialog, .popover'));
    if (!finePointer || reducedMotion || insidePopup) return;

    let frame = 0;
    let demoFrame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let resetting = false;
    let resetStart = 0;
    let fromX = 0;
    let fromY = 0;

    const setLight = (px: number, py: number) => {
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
    };

    const tick = () => {
      if (resetting) {
        const elapsed = Math.min(1, (performance.now() - resetStart) / RESET_MS);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        currentX = fromX * (1 - eased);
        currentY = fromY * (1 - eased);
        if (elapsed >= 1) resetting = false;
      } else {
        currentX += (targetX - currentX) * LERP;
        currentY += (targetY - currentY) * LERP;
      }

      card.style.transform = `rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg)`;
      frame = window.requestAnimationFrame(tick);
    };

    const applyPoint = (clientX: number, clientY: number) => {
      const rect = tilt.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const py = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      setLight(px, py);
      targetX = (py - 0.5) * 2 * MAX_TILT;
      targetY = (0.5 - px) * 2 * MAX_TILT;
      resetting = false;
      card.classList.add("is-lit");
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => applyPoint(event.clientX, event.clientY);

    const onPointerLeave = () => {
      fromX = currentX;
      fromY = currentY;
      targetX = 0;
      targetY = 0;
      resetStart = performance.now();
      resetting = true;
      card.classList.remove("is-lit");
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    tilt.addEventListener("pointermove", onPointerMove);
    tilt.addEventListener("pointerleave", onPointerLeave);

    const interactive = (window as unknown as { __uiInteractive?: boolean }).__uiInteractive === true;
    const cursor = (window as unknown as { __uiDemoCursor?: DemoCursor }).__uiDemoCursor;

    if (!interactive && !insidePopup && typeof cursor?.at === "function") {
      const demoStart = performance.now();
      const demo = () => {
        const progress = Math.min(1, (performance.now() - demoStart) / 4200);
        const angle = progress * Math.PI * 2;
        const px = 0.5 + Math.cos(angle) * 0.42;
        const py = 0.5 + Math.sin(angle) * 0.42;
        const rect = tilt.getBoundingClientRect();
        const x = rect.left + px * rect.width;
        const y = rect.top + py * rect.height;

        try {
          cursor.at?.({ x, y });
        } catch {
          try {
            cursor.at?.(x, y);
          } catch {
            // Demo cursor API is optional; the card demo still runs.
          }
        }

        applyPoint(x, y);
        if (progress < 1) {
          demoFrame = window.requestAnimationFrame(demo);
        } else {
          cursor.hide?.();
          onPointerLeave();
        }
      };
      demoFrame = window.requestAnimationFrame(demo);
    }

    return () => {
      tilt.removeEventListener("pointermove", onPointerMove);
      tilt.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
      if (demoFrame) window.cancelAnimationFrame(demoFrame);
    };
  }, []);

  return (
    <div ref={tiltRef} className={`tilt ${className}`.trim()}>
      <div ref={cardRef} className={`tilt__card ${cardClassName}`.trim()}>
        <span className="tilt__spot tilt__spot--large" aria-hidden="true" />
        <span className="tilt__spot tilt__spot--small" aria-hidden="true" />
        <div className="tilt__content">{children}</div>
      </div>
    </div>
  );
}
