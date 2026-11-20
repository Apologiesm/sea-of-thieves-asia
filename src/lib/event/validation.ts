import { z } from "zod";
import { sanitizeLine, sanitizeParagraph } from "@/lib/crew/validation";

const line = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, max) : ""), z.string().max(max));
const requiredLine = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, max) : ""), z.string().min(1).max(max));

export const eventSchema = z
  .object({
    title: requiredLine(120),
    description: z.preprocess(
      (v) => (typeof v === "string" ? sanitizeParagraph(v, 800) : ""),
      z.string().max(800),
    ),
    eventType: z.enum([
      "fleet_night",
      "pvp_tournament",
      "treasure_hunt",
      "new_captain_orientation",
      "stream_night",
      "community_challenge",
    ]),
    region: line(80),
    platform: line(80),
    timezone: z.string().min(1).max(64),
    startsAt: z.string().datetime(),
    endsAt: z.preprocess(
      (v) => (typeof v === "string" && v.length > 0 ? v : null),
      z.string().datetime().nullable(),
    ),
    location: line(120),
    discordEventUrl: z.preprocess(
      (v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null),
      z.string().url().nullable(),
    ),
    imageUrl: z.preprocess(
      (v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null),
      z.string().url().max(2000).nullable(),
    ),
    maxAttendees: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z.coerce.number().int().min(1).max(500).nullable(),
    ),
    status: z.enum(["draft", "published", "cancelled", "completed"]),
  })
  .refine((value) => !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

export type EventInput = z.infer<typeof eventSchema>;

export function toEventRow(input: EventInput, slug?: string) {
  return {
    ...(slug ? { slug } : {}),
    title: input.title,
    description: input.description || null,
    event_type: input.eventType,
    region: input.region || null,
    platform: input.platform || null,
    timezone: input.timezone,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    location: input.location || null,
    discord_event_url: input.discordEventUrl,
    image_url: input.imageUrl,
    max_attendees: input.maxAttendees,
    status: input.status,
  };
}

export const eventFiltersSchema = z.object({
  type: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 40) : ""), z.string()).default(""),
  region: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
  platform: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
  date: z.preprocess((v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ""), z.string()).default(""),
  status: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 20) : ""), z.string()).default("published"),
});

export const rsvpSchema = z.object({
  status: z.enum(["going", "maybe", "cant_go"]),
});

export const eventStatusSchema = z.object({
  status: z.enum(["draft", "published", "cancelled", "completed"]),
});
