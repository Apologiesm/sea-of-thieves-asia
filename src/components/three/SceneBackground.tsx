"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { NoWebGLFallback } from "./NoWebGLFallback";

const OceanScene = lazy(() => import("./OceanScene"));

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export function SceneBackground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(6);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
      setWebgl(detectWebGL());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!mounted || !webgl || !hostRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [mounted, webgl]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 7, 92));
    }, 220);
    return () => window.clearInterval(timer);
  }, [ready]);

  const handleReady = useCallback(() => {
    setProgress(100);
    setReady(true);
  }, []);

  if (!mounted) {
    return <div className="scene-layer scene-layer--placeholder" aria-hidden="true" />;
  }

  if (!webgl) {
    return <NoWebGLFallback />;
  }

  return (
    <div ref={hostRef} className="scene-layer" aria-hidden="true">
      <Suspense fallback={null}>
        <OceanScene active={visible && inView} onReady={handleReady} />
      </Suspense>
      <div
        className={`scene-loader${ready ? " scene-loader--done" : ""}`}
        role="status"
        aria-live="polite"
      >
        <div className="scene-loader__inner">
          <span className="scene-loader__mark" />
          <p>Preparing the voyage</p>
          <div className="scene-loader__track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="scene-loader__percent">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
