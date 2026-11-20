/**
 * Single source of truth for all public-facing copy.
 * Source rules: AGENTS.md, docs/brand.md, docs/content.md, docs/assets.md.
 * Placeholder values are never rendered as real links.
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
  { key: "discord", label: "Discord", value: "https://discord.com/invite/dSX5FNy6sB" },
  { key: "youtube", label: "YouTube", value: PLACEHOLDER },
  { key: "twitch", label: "Twitch", value: PLACEHOLDER },
  { key: "x", label: "X", value: PLACEHOLDER },
  { key: "instagram", label: "Instagram", value: "https://instagram.com/seaofthievesasia" },
  { key: "facebook", label: "Facebook", value: "https://facebook.com/SeaOfThievesAsia" },
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

export function getSection(key: SectionKey): SectionConfig {
  return SECTIONS.find((section) => section.key === key) ?? SECTIONS[0];
}

export function getPreview(key: SectionKey): PreviewConfig {
  return PREVIEWS.find((preview) => preview.key === key) ?? PREVIEWS[0];
}

export const NAV_LINKS: readonly { href: string; label: string }[] = [
  { href: "/events", label: "Events" },
  { href: "/crew", label: "Crew" },
  { href: "/gallery", label: "Gallery" },
  { href: "/guides", label: "Guides" },
  { href: "/announcements", label: "News" },
] as const;

export const HERO = {
  eyebrow: "Unofficial fan community · Asia region",
  title: "Set Sail With Sea of Thieves Asia",
  subtitle: "Find your crew. Conquer the seas.",
  body: "A place for pirates across the region to gather, share voyages, and build stories on the high seas.",
  primaryCta: { label: "Explore the community", href: "#community" },
  secondaryCta: { label: "See what is coming", href: "#sections" },
  status: "Beta · content is being prepared",
} as const;

export const ABOUT = {
  eyebrow: "About the community",
  title: "A home for Asian pirates",
  paragraphs: [
    "Sea of Thieves Asia brings players from across the region together around one shared love of the seas. Whether you are charting your first voyage or chasing a legendary title, there is room here for you.",
    "This site is being built around the community, not in place of it. Every section will fill with real members, real voyages, and real stories once they are ready to be shared.",
  ],
  pillars: [
    {
      title: "Across the region",
      body: "One gathering place for players across Asian time zones and communities.",
    },
    {
      title: "Built together",
      body: "Guides, events, and crew listings shaped by the people who sail them.",
    },
    {
      title: "Player first",
      body: "Minimal data, clear controls, and respect for every member's privacy.",
    },
  ],
} as const;

export const EVENT_TYPES = [
  { value: "fleet_night", label: "Fleet Night" },
  { value: "pvp_tournament", label: "PvP Tournament" },
  { value: "treasure_hunt", label: "Treasure Hunt" },
  { value: "new_captain_orientation", label: "New Captain Orientation" },
  { value: "stream_night", label: "Stream Night" },
  { value: "community_challenge", label: "Community Challenge" },
] as const;

export const EVENT_STATUSES = ["draft", "published", "cancelled", "completed"] as const;
export const EVENT_REGIONS = ["Southeast Asia", "East Asia", "South Asia", "Oceania", "Central Asia", "Middle East"] as const;
export const EVENT_PLATFORMS = ["PC", "Xbox", "PlayStation", "Cross-platform"] as const;
export const ASIAN_TIMEZONES = [
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Ho_Chi_Minh",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Dubai",
] as const;

export const EVENT_PRIVACY_NOTICE =
  "Events show the details the host publishes. RSVPs are visible only to the event host and moderators; other members see aggregate counts, not who attended.";

export const CREW_OPTIONS = {
  regions: ["Southeast Asia", "East Asia", "South Asia", "Oceania", "Central Asia", "Middle East"],
  platforms: ["PC", "Xbox", "PlayStation", "Cross-platform"],
  languages: ["English", "Bahasa Indonesia", "Mandarin", "Cantonese", "Japanese", "Korean", "Thai", "Vietnamese", "Tagalog", "Hindi", "Arabic"],
  playstyles: ["Casual", "Competitive", "Roleplay", "Exploration", "PvP", "PvE", "Mixed"],
  shipPreferences: ["Sloop", "Brigantine", "Galleon", "Any ship"],
  rolePreferences: ["Captain", "Helm", "Cannoneer", "Navigator", "Support", "Any role"],
  availability: ["Weekdays", "Weekends", "Evenings (Asia time)", "Mornings (Asia time)", "Flexible"],
} as const;

export const CREW_PRIVACY_NOTICE =
  "Crew listings show the profile fields you chose to make visible, plus the listing details you enter. Your Discord identity, email and private contact details are never public. Contact details appear only if you explicitly consent on the listing.";

export type FeatureConfig = {
  key: string;
  title: string;
  description: string;
  size: "large" | "small";
};

export const FEATURES: readonly FeatureConfig[] = [
  {
    key: "crew",
    title: "Find your crew",
    description:
      "Post a voyage or answer one. Crew listings are being prepared for the community.",
    size: "large",
  },
  {
    key: "events",
    title: "Sail together",
    description: "Community events and meetups, published only when confirmed.",
    size: "small",
  },
  {
    key: "guides",
    title: "Learn the ropes",
    description: "A knowledge base written by players, for players.",
    size: "small",
  },
  {
    key: "gallery",
    title: "Share the view",
    description: "A moderated gallery for the moments worth keeping.",
    size: "small",
  },
] as const;

export type PreviewConfig = {
  key: SectionKey;
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  reverse: boolean;
};

export const PREVIEWS: readonly PreviewConfig[] = [
  {
    key: "events",
    eyebrow: "Events",
    title: "The next voyage starts here",
    description:
      "Community voyages, meetups, and seasonal activities will be announced here. Nothing is published until it is real.",
    emptyTitle: "No voyages on the horizon",
    emptyDescription: "Events are marked EMPTY_FOR_BETA and will appear when scheduled.",
    reverse: false,
  },
  {
    key: "crewListings",
    eyebrow: "Crew finder",
    title: "No pirate sails alone",
    description:
      "Find a crew for a specific run, a weekly session, or a first voyage. Listings open when members start posting them.",
    emptyTitle: "No crews posted yet",
    emptyDescription: "Crew listings are marked EMPTY_FOR_BETA.",
    reverse: true,
  },
  {
    key: "gallery",
    eyebrow: "Gallery",
    title: "Stories worth keeping",
    description:
      "A moderated collection of screenshots and artwork from the community. Every image gets here through review.",
    emptyTitle: "The gallery is waiting",
    emptyDescription: "Gallery entries are marked EMPTY_FOR_BETA.",
    reverse: false,
  },
  {
    key: "guides",
    eyebrow: "Guides",
    title: "Knowledge passed down",
    description:
      "Practical guides for new and veteran pirates, built from real experience rather than filler.",
    emptyTitle: "No guides published yet",
    emptyDescription: "Guides are marked EMPTY_FOR_BETA.",
    reverse: true,
  },
  {
    key: "announcements",
    eyebrow: "News",
    title: "Signals from the shore",
    description:
      "Updates from the community team, posted here once there is something genuine to report.",
    emptyTitle: "All quiet for now",
    emptyDescription: "Announcements are marked EMPTY_FOR_BETA.",
    reverse: false,
  },
] as const;

export const JOIN_CTA = {
  eyebrow: "The community is on Discord",
  title: "Join the crew on Discord",
  body: "Conversations, voice channels, and voyage planning live on our Discord server. Join us there to find a crew and stay up to date.",
  buttonLabel: "Join Discord",
  linkValue: "https://discord.com/invite/dSX5FNy6sB",
  note: "You will be taken to Discord to accept the invite.",
} as const;

export type FooterItem = { label: string; value: string };

export const FOOTER = {
  tagline: "An unofficial fan community for Sea of Thieves players in Asia.",
  columns: [
    { title: "Explore", items: NAV_LINKS.map((l) => ({ label: l.label, value: l.href })) },
    {
      title: "Community",
      items: SOCIAL_LINKS.filter((l) => l.key !== "contact").map((l) => ({
        label: l.label,
        value: l.value,
      })),
    },
    {
      title: "Information",
      items: [
        { label: "Rules", value: PLACEHOLDER },
        { label: "Privacy", value: "/privacy" },
        { label: "Terms", value: PLACEHOLDER },
        { label: "Contact", value: PLACEHOLDER },
        { label: "Credits", value: PLACEHOLDER },
      ] as FooterItem[],
    },
  ],
} as const;
