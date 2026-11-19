/**
 * Mutable voyage state shared between GSAP and the R3F render loop.
 * Deliberately not React state: it is read every frame and must not cause
 * component re-renders.
 */

export type VoyageStore = {
  /** Raw normalized ScrollTrigger progress (0..1). */
  raw: number;
  /** Smoothed progress used by the 3D scene (0..1). */
  progress: number;
  /** Desktop pointer parallax, normalized to -1..1. */
  mouseX: number;
  mouseY: number;
  reducedMotion: boolean;
};

export const voyageStore: VoyageStore = {
  raw: 0,
  progress: 0,
  mouseX: 0,
  mouseY: 0,
  reducedMotion: false,
};

export const VOYAGE_STOPS = [
  { label: "Departure", at: 0 },
  { label: "Crew", at: 0.25 },
  { label: "Events", at: 0.5 },
  { label: "Treasure", at: 0.75 },
  { label: "Join", at: 1 },
] as const;

/** First slice of scroll holds the hero before the voyage begins. */
export const HOLD = 0.06;

export function heldProgress(raw: number): number {
  return Math.min(1, Math.max(0, (raw - HOLD) / (1 - HOLD)));
}
