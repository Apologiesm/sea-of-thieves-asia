import { z } from "zod";
import { sanitizeLine, sanitizeParagraph } from "@/lib/crew/validation";

const line = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, max) : ""), z.string().max(max));
const requiredLine = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, max) : ""), z.string().min(1).max(max));
const markdown = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? sanitizeParagraph(v, max) : ""), z.string().min(1).max(max));

export const guideSchema = z.object({
  title: requiredLine(140),
  category: z.string().min(1).max(60),
  tags: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().max(300)),
  excerpt: line(240),
  body: markdown(20000),
  status: z.enum(["draft", "published", "archived"]),
});

export const announcementSchema = z.object({
  title: requiredLine(140),
  category: z.string().min(1).max(60),
  coverImageUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null),
    z.string().url().max(2000).nullable(),
  ),
  body: markdown(10000),
  pinned: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]),
});

export const galleryMetaSchema = z.object({
  caption: line(240),
  altText: requiredLine(250),
});

export const reportSchema = z.object({
  targetType: z.enum(["profile", "crew_listing", "event", "comment", "gallery_item", "guide", "announcement"]),
  targetId: z.string().uuid(),
  reason: requiredLine(160),
  details: z.preprocess((v) => (typeof v === "string" ? sanitizeParagraph(v, 500) : ""), z.string().max(500)),
});

export const commentSchema = z.object({
  targetType: z.enum(["guide", "event"]),
  targetId: z.string().uuid(),
  body: z.preprocess((v) => (typeof v === "string" ? sanitizeParagraph(v, 1200) : ""), z.string().min(1).max(1200)),
});

export const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["member", "moderator", "admin", "owner"]),
});

export const galleryModerationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export function parseTags(value: string): string[] {
  return value.split(",").map((tag) => sanitizeLine(tag, 40)).filter(Boolean).slice(0, 12);
}

export function readingMinutes(body: string): number {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 220));
}
