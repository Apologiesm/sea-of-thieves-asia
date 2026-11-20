"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  poster: string;
  variant: "hero" | "page";
};

/** Single purpose video layer. No effects, no overlays, no tracking. */
export function VideoLayer({ src, poster, variant }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) video.pause();
      else void video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className={`video-layer video-layer--${variant}`} data-video-layer={variant} aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        onCanPlay={() => {
          void videoRef.current?.play().catch(() => {});
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
