"use client";

import { useEffect, useRef } from "react";

/** Muted looping video used as the page background. No audio, no tracking. */
export function VideoBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) {
        video.pause();
      } else {
        void video.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className="video-backdrop" aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/backgrounds/trailer-poster.jpg"
      >
        <source src="/backgrounds/trailer-loop.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
