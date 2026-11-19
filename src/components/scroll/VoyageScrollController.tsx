"use client";

import { useEffect, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HOLD, heldProgress, voyageStore } from "@/lib/scroll/voyage-store";

function setupVoyage(): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  voyageStore.reducedMotion = reduced;

  if (reduced) {
    voyageStore.raw = 0;
    voyageStore.progress = 0;
    return () => {
      voyageStore.reducedMotion = false;
    };
  }

  gsap.registerPlugin(ScrollTrigger);

  const reveals = gsap.utils.toArray<HTMLElement>("[data-voyage-reveal]");
  const sections = gsap.utils.toArray<HTMLElement>("main section");

  if (reveals.length > 0) {
    gsap.set(reveals, { opacity: 0.65, y: 22 });
  }

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        voyageStore.raw = self.progress;
        voyageStore.progress = heldProgress(self.progress);
      },
    },
  });

  timeline.to({}, { duration: HOLD });

  const travel = 1 - HOLD;
  const hero = document.querySelector<HTMLElement>("[data-voyage-hero]");
  if (hero) {
    timeline.to(hero, { y: -36, opacity: 0.4, duration: travel * 0.22 }, HOLD);
  }

  sections.forEach((section, index) => {
    const targets = section.querySelectorAll<HTMLElement>("[data-voyage-reveal]");
    if (!targets.length) return;
    const start = HOLD + (index / Math.max(sections.length, 1)) * travel * 0.8;
    timeline.fromTo(
      targets,
      { opacity: 0.65, y: 22 },
      { opacity: 1, y: 0, duration: travel * 0.16, stagger: 0.012 },
      start,
    );
  });

  let onPointerMove: ((event: PointerEvent) => void) | null = null;
  if (window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches) {
    onPointerMove = (event) => {
      voyageStore.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      voyageStore.mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  }

  return () => {
    if (onPointerMove) window.removeEventListener("pointermove", onPointerMove);
    timeline.scrollTrigger?.kill();
    timeline.kill();
    if (reveals.length > 0) {
      gsap.killTweensOf(reveals);
      gsap.set(reveals, { clearProps: "opacity,transform" });
    }
    voyageStore.raw = 0;
    voyageStore.progress = 0;
    voyageStore.mouseX = 0;
    voyageStore.mouseY = 0;
    voyageStore.reducedMotion = false;
  };
}

const subscribeNoop = () => () => {};

export function VoyageScrollController() {
  // True only after the client has hydrated, so GSAP never adds inline styles
  // to server-rendered markup before React compares it.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!hydrated) return;
    return setupVoyage();
  }, [hydrated]);

  return null;
}
