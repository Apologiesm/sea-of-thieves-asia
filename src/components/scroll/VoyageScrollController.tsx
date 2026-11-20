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
  const heroVideo = document.querySelector<HTMLElement>('[data-video-layer="hero"]');
  const pageVideo = document.querySelector<HTMLElement>('[data-video-layer="page"]');

  if (reveals.length > 0) {
    gsap.set(reveals, { opacity: 0.9, y: 16 });
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
        const raw = self.progress;
        voyageStore.raw = raw;
        voyageStore.progress = heldProgress(raw);

        // Clean crossfade: hero clip fades out as it leaves, page clip fades in.
        if (heroVideo) {
          heroVideo.style.opacity = String(Math.max(0, Math.min(1, 1 - raw / 0.13)));
        }
        if (pageVideo) {
          pageVideo.style.opacity = String(
            Math.max(0, Math.min(1, (raw - 0.05) / 0.09)),
          );
        }
      },
    },
  });

  timeline.to({}, { duration: HOLD });

  const travel = 1 - HOLD;

  sections.forEach((section, index) => {
    const targets = section.querySelectorAll<HTMLElement>("[data-voyage-reveal]");
    if (!targets.length) return;
    const start = HOLD + (index / Math.max(sections.length, 1)) * travel * 0.8;
    timeline.fromTo(
      targets,
      { opacity: 0.9, y: 16 },
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
    if (heroVideo) heroVideo.style.opacity = "";
    if (pageVideo) pageVideo.style.opacity = "";
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
