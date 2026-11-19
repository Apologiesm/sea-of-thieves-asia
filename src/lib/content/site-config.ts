/**
 * Content configuration for the beta build.
 * Source of truth: AGENTS.md, docs/brand.md, docs/content.md, docs/assets.md.
 * No value here may be replaced with a guessed or invented link.
 */

export const PLACEHOLDER = "REPLACE_BEFORE_LAUNCH" as const;
export const EMPTY_FOR_BETA = "EMPTY_FOR_BETA" as const;

export const SITE = {
  name: "Sea of Thieves Asia",
  shortName: "SoT Asia",
  description:
    "An unofficial fan community for Sea of Thieves players across the Asia region.",
  comingSoon: "Coming soon",
  disclaimer:
    "Sea of Thieves Asia is an unofficial fan community and is not affiliated with, endorsed by, or connected to Rare, Xbox, or Sea of Thieves.",
} as const;

export type SocialLink = {
  key: string;
  label: string;
  value: string;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { key: "discord", label: "Discord", value: PLACEHOLDER },
  { key: "youtube", label: "YouTube", value: PLACEHOLDER },
  { key: "twitch", label: "Twitch", value: PLACEHOLDER },
  { key: "x", label: "X", value: PLACEHOLDER },
  { key: "instagram", label: "Instagram", value: PLACEHOLDER },
  { key: "tiktok", label: "TikTok", value: PLACEHOLDER },
  { key: "contact", label: "Contact email", value: PLACEHOLDER },
] as const;

export type SectionKey =
  | "events"
  | "announcements"
  | "guides"
  | "gallery"
  | "crewListings";

export type SectionConfig = {
  key: SectionKey;
  title: string;
  href: string;
  description: string;
  state: typeof EMPTY_FOR_BETA;
};

export const SECTIONS: readonly SectionConfig[] = [
  {
    key: "events",
    title: "Events",
    href: "/events",
    description: "Community voyages, meetups, and activities.",
    state: EMPTY_FOR_BETA,
  },
  {
    key: "announcements",
    title: "Announcements",
    href: "/announcements",
    description: "News and updates from the community team.",
    state: EMPTY_FOR_BETA,
  },
  {
    key: "guides",
    title: "Guides",
    href: "/guides",
    description: "A knowledge base for new and veteran pirates.",
    state: EMPTY_FOR_BETA,
  },
  {
    key: "gallery",
    title: "Gallery",
    href: "/gallery",
    description: "Screenshots and artwork from the community.",
    state: EMPTY_FOR_BETA,
  },
  {
    key: "crewListings",
    title: "Crew Listings",
    href: "/crew",
    description: "Find a crew for your next voyage.",
    state: EMPTY_FOR_BETA,
  },
] as const;

export const NAV_LINKS: readonly { href: string; label: string }[] = [
  { href: "/events", label: "Events" },
  { href: "/announcements", label: "News" },
  { href: "/guides", label: "Guides" },
  { href: "/gallery", label: "Gallery" },
  { href: "/crew", label: "Crew" },
] as const;
