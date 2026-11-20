import { z } from "zod";

export const VISIBILITIES = ["private", "members", "public"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type MemberProfile = {
  id: string;
  discord_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  languages: string[] | null;
  platform: string | null;
  playstyle: string | null;
  social_links: Record<string, string> | null;
  crew_name: string | null;
  crew_role: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type EditableProfile = {
  display_name: string;
  region: string;
  languages: string;
  platform: string;
  playstyle: string;
  bio: string;
  socialWebsite: string;
  socialX: string;
  socialYoutube: string;
  crewName: string;
  crewRole: string;
  visibility: Visibility;
};

export const editableProfileSchema = z.object({
  display_name: z.string().max(64),
  region: z.string().max(80),
  languages: z.string().max(200),
  platform: z.string().max(80),
  playstyle: z.string().max(80),
  bio: z.string().max(500),
  socialWebsite: z.string().max(300),
  socialX: z.string().max(300),
  socialYoutube: z.string().max(300),
  crewName: z.string().max(80),
  crewRole: z.string().max(80),
  visibility: z.enum(VISIBILITIES),
});

export const EMPTY_EDITABLE_PROFILE: EditableProfile = {
  display_name: "",
  region: "",
  languages: "",
  platform: "",
  playstyle: "",
  bio: "",
  socialWebsite: "",
  socialX: "",
  socialYoutube: "",
  crewName: "",
  crewRole: "",
  visibility: "private",
};

export function toEditableProfile(profile: MemberProfile): EditableProfile {
  const links = profile.social_links ?? {};
  return {
    display_name: profile.display_name ?? "",
    region: profile.region ?? "",
    languages: (profile.languages ?? []).join(", "),
    platform: profile.platform ?? "",
    playstyle: profile.playstyle ?? "",
    bio: profile.bio ?? "",
    socialWebsite: links.website ?? "",
    socialX: links.x ?? "",
    socialYoutube: links.youtube ?? "",
    crewName: profile.crew_name ?? "",
    crewRole: profile.crew_role ?? "",
    visibility: profile.visibility,
  };
}

export function normalizeProfile(input: EditableProfile) {
  const clean = (value: string, max: number) => value.trim().slice(0, max);
  const social_links: Record<string, string> = {};
  for (const [key, value] of [
    ["website", input.socialWebsite],
    ["x", input.socialX],
    ["youtube", input.socialYoutube],
  ] as const) {
    const url = value.trim();
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        throw new Error(`Social link for ${key} must start with http(s)://`);
      }
      social_links[key] = url.slice(0, 300);
    }
  }

  const languages = input.languages
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  return {
    display_name: clean(input.display_name, 64) || null,
    region: clean(input.region, 80) || null,
    languages,
    platform: clean(input.platform, 80) || null,
    playstyle: clean(input.playstyle, 80) || null,
    bio: clean(input.bio, 500) || null,
    social_links,
    crew_name: clean(input.crewName, 80) || null,
    crew_role: clean(input.crewRole, 80) || null,
    visibility: input.visibility,
  };
}
