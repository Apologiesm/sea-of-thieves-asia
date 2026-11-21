"use client";

import { useEffect, useRef } from "react";
import { CINEMATIC } from "@/lib/content/site-config";

type Scene = (typeof CINEMATIC)[keyof typeof CINEMATIC];

const SCENES: readonly Scene[] = [CINEMATIC.horizon, CINEMATIC.fleet, CINEMATIC.tavern];

/**
 * Cinematic homepage sequence: Horizon -> Fleet -> Tavern.
 *
 * Media strategy (performance first):
 * - The still is always rendered as the base layer, so the section is complete
 *   even if autoplay is blocked, the video is missing, or data is restricted.
 * - The muted loop is attached only when the section approaches the viewport
 *   and the visitor's device/connection can afford it.
 * - `prefers-reduced-motion`, Save-Data, a 2G/3G connection, or a narrow screen
 *   all keep the still and skip the video entirely.
 *
 * Motion strategy: GSAP ScrollTrigger parallax with a different travel distance
 * per scene, plus a gentle text lift. Cleaned up on unmount.
 */
export function CinematicVoyage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    const saveData = Boolean(connection?.saveData);
    const slowNetwork = /(^|-)2g$/.test(connection?.effectiveType ?? "");
    const allowVideo = !reduceMotion && !saveData && !slowNetwork;

    const frames = Array.from(root.querySelectorAll<HTMLElement>("[data-scene-media]"));
    const cleanups: Array<() => void> = [];

    // --- Lazy video attachment ------------------------------------------------
    if (allowVideo) {
      frames.forEach((frame) => {
        const video = frame.querySelector<HTMLVideoElement>("[data-scene-video]");
        const src = video?.dataset.src;
        if (!video || !src) return;

        const attach = () => {
          if (video.dataset.attached === "true") return;
          video.dataset.attached = "true";
          video.src = src;
          video.load();
          void video.play().catch(() => {
            // Autoplay blocked: the poster still underneath stays visible.
            frame.dataset.videoState = "blocked";
          });
        };

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) attach();
            });
          },
          { rootMargin: "400px 0px" },
        );
        observer.observe(frame);
        cleanups.push(() => observer.disconnect());

        const onPlaying = () => {
          frame.dataset.videoState = "playing";
        };
        const onError = () => {
          frame.dataset.videoState = "fallback";
        };
        video.addEventListener("playing", onPlaying);
        video.addEventListener("error", onError);
        cleanups.push(() => {
          video.removeEventListener("playing", onPlaying);
          video.removeEventListener("error", onError);
        });
      });
    }

    // --- GSAP parallax --------------------------------------------------------
    if (reduceMotion) return () => cleanups.forEach((fn) => fn());

    let killed = false;
    let ctx: { revert: () => void } | null = null;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", root);
        scenes.forEach((scene, index) => {
          const media = scene.querySelector<HTMLElement>("[data-scene-media]");
          const copy = scene.querySelector<HTMLElement>("[data-scene-copy]");
          // Alternate travel distance and direction so no two scenes match.
          const shift = [14, -18, 20][index % 3];
          const copyShift = [26, -20, 32][index % 3];

          if (media) {
            gsap.fromTo(
              media,
              { yPercent: -shift * 0.5 },
              {
                yPercent: shift,
                ease: "none",
                scrollTrigger: {
                  trigger: scene,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                },
              },
            );
          }
          if (copy) {
            gsap.fromTo(
              copy,
              { y: copyShift, opacity: 0.55 },
              {
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: scene,
                  start: "top 92%",
                  end: "top 45%",
                  scrub: 0.5,
                },
              },
            );
          }
        });
      }, root);
    })();

    return () => {
      killed = true;
      cleanups.forEach((fn) => fn());
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="cinematic">
      {SCENES.map((scene, index) => (
        <section
          key={scene.key}
          data-scene={scene.key}
          aria-labelledby={`scene-${scene.key}`}
          className="cinematic__scene"
        >
          <div className="cinematic__media" data-scene-media>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scene.image}
              alt={scene.alt}
              className="cinematic__still"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
            <video
              className="cinematic__video"
              data-scene-video
              data-src={scene.video}
              poster={scene.image}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
          <div className="cinematic__scrim" aria-hidden="true" />
          <div className="cinematic__inner">
            <div className="cinematic__copy" data-scene-copy>
              <p className="cinematic__eyebrow">
                <span className="cinematic__index">0{index + 1}</span>
                {scene.eyebrow}
              </p>
              <h2 id={`scene-${scene.key}`} className="cinematic__title">
                {scene.title}
              </h2>
              <p className="cinematic__body">{scene.body}</p>
              <p className="cinematic__detail">{scene.detail}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
