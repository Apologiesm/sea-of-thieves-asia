/** Server-only in-memory rate limiter. Reset on process restart. */
type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

export const LIMITS = {
  create: { limit: 5, windowMs: 60 * 60 * 1000 },
  edit: { limit: 20, windowMs: 60 * 60 * 1000 },
  report: { limit: 5, windowMs: 60 * 60 * 1000 },
  moderate: { limit: 30, windowMs: 60 * 60 * 1000 },
  eventCreate: { limit: 10, windowMs: 60 * 60 * 1000 },
  eventEdit: { limit: 30, windowMs: 60 * 60 * 1000 },
  rsvp: { limit: 30, windowMs: 60 * 60 * 1000 },
  guideCreate: { limit: 20, windowMs: 60 * 60 * 1000 },
  galleryUpload: { limit: 10, windowMs: 60 * 60 * 1000 },
  reportSubmit: { limit: 8, windowMs: 60 * 60 * 1000 },
  comment: { limit: 30, windowMs: 60 * 60 * 1000 },
} as const;
