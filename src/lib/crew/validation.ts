import { z } from "zod";

/** Strip markup and control characters. All user content is rendered as text. */
export function sanitizeLine(value: string, max = 80): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function sanitizeParagraph(value: string, max = 600): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

const line = (max: number) =>
  z.preprocess((value) => (typeof value === "string" ? sanitizeLine(value, max) : ""), z.string().max(max));

const requiredLine = (max: number) =>
  z.preprocess((value) => (typeof value === "string" ? sanitizeLine(value, max) : ""), z.string().min(1).max(max));

export const crewListingSchema = z.object({
  title: requiredLine(100),
  description: z.preprocess(
    (value) => (typeof value === "string" ? sanitizeParagraph(value) : ""),
    z.string().max(600),
  ),
  region: line(80),
  platform: line(80),
  languages: z.preprocess((value) => (typeof value === "string" ? value : ""), z.string().max(200)),
  playstyle: line(80),
  shipPreference: line(80),
  rolePreference: line(80),
  availability: line(80),
  seatsTotal: z.coerce.number().int().min(1).max(20),
  status: z.enum(["open", "closed"]).default("open"),
  contactConsent: z.boolean().default(false),
  contactMethod: line(200),
  expiresAt: z.preprocess(
    (value) => (typeof value === "string" && value.length > 0 ? value : null),
    z.string().datetime().nullable().default(null),
  ),
  imageUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : null),
    z.string().url().max(2000).nullable(),
  ),
});

export type CrewListingInput = z.infer<typeof crewListingSchema>;

export function parseLanguages(value: string): string[] {
  return value
    .split(",")
    .map((item) => sanitizeLine(item, 40))
    .filter(Boolean)
    .slice(0, 12);
}

export function toCrewRow(input: CrewListingInput) {
  return {
    title: input.title,
    description: input.description || null,
    region: input.region || null,
    platform: input.platform || null,
    languages: parseLanguages(input.languages),
    playstyle: input.playstyle || null,
    ship_preference: input.shipPreference || null,
    role_preference: input.rolePreference || null,
    availability: input.availability || null,
    seats_total: input.seatsTotal,
    status: input.status,
    contact_consent: input.contactConsent,
    contact_method: input.contactConsent && input.contactMethod ? input.contactMethod : null,
    expires_at: input.expiresAt,
    image_url: input.imageUrl,
  };
}

export const crewFiltersSchema = z.object({
  q: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 100) : ""), z.string()).default(""),
  region: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
  platform: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
  language: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 40) : ""), z.string()).default(""),
  playstyle: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
  shipPreference: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
  rolePreference: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
  availability: z.preprocess((v) => (typeof v === "string" ? sanitizeLine(v, 80) : ""), z.string()).default(""),
});

export const reportSchema = z.object({
  reason: z.preprocess(
    (value) => (typeof value === "string" ? sanitizeLine(value, 160) : ""),
    z.string().min(1).max(160),
  ),
  details: z.preprocess(
    (value) => (typeof value === "string" ? sanitizeParagraph(value, 500) : ""),
    z.string().max(500),
  ),
});

export const moderationSchema = z.object({
  action: z.enum(["hide", "remove", "restore"]),
  note: z.preprocess(
    (value) => (typeof value === "string" ? sanitizeParagraph(value, 300) : ""),
    z.string().max(300),
  ),
});
