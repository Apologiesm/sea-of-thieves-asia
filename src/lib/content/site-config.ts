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
  eyebrow: "Sea of Thieves Asia · Asia region",
  title: "Set Sail With Sea of Thieves Asia",
  subtitle: "Find your crew. Conquer the seas.",
  body: "A place for pirates across the region to gather, share voyages, and build stories on the high seas.",
  primaryCta: { label: "Explore the community", href: "#community" },
  secondaryCta: { label: "See what is coming", href: "#sections" },
  status: "Built by players, for players · Asia region",
} as const;

export const ABOUT = {
  eyebrow: "About the community",
  title: "A home for pirates across Asia",
  paragraphs: [
    "From Singapore and Jakarta to Manila, Seoul, Tokyo and beyond, Sea of Thieves Asia gathers players who sail the same seas in very different time zones. The fleets here meet on weekday evenings after work, on weekend mornings before the heat sets in, and late at night across the region.",
    "Everything on this site is shaped by the people who actually sail: crews listing the languages they speak, hosts publishing voyages with times shown in your own zone, and guides written by players who learned the hard way. Nothing is published until a real member posts it.",
  ],
  pillars: [
    {
      title: "One region, many hours",
      body: "Events carry their own timezone and show your local time, so a fleet night in Jakarta still reads clearly in Manila or Seoul.",
    },
    {
      title: "Crews that speak your language",
      body: "Listings show the languages a crew actually uses — English, Bahasa Indonesia, Mandarin, Japanese, Korean, Thai, Tagalog and more.",
    },
    {
      title: "Built from real voyages",
      body: "Guides, screenshots and event reports come from members' own sessions, shared with their permission.",
    },
  ],
} as const;

export const CINEMATIC = {
  horizon: {
    key: "horizon",
    eyebrow: "Horizon",
    title: "First light over the archipelago",
    body: "Morning sails across the region, from the South China Sea to the straits around Singapore and the islands north of the Philippines.",
    detail: "Fleets here are usually posted for the evening, once the region's work day ends.",
    image: "/media/sot-horizon.jpg",
    video: "/media/sot-horizon-motion.mp4",
    alt: "A pirate looking out over calm water at sunrise from the deck of a sloop.",
  },
  fleet: {
    key: "fleet",
    eyebrow: "Fleet",
    title: "Sails on the same water",
    body: "Fleet nights put three, four or six crews on one stretch of ocean and let the evening run itself: galleon lines off an outpost, a brigantine contest, a sloop doing the quiet work.",
    detail: "Crew listings show timezone and languages up front, so you can pick a ship that sails when you do.",
    image: "/media/sot-galleon.jpg",
    video: "/media/sot-galleon-motion.mp4",
    alt: "A galleon anchored off a palm-covered island at golden hour.",
  },
  tavern: {
    key: "tavern",
    eyebrow: "Tavern",
    title: "The lantern stays lit",
    body: "Between voyages the conversation lives on Discord: voyage planning, trade runs, tall tale help, and the screenshots worth keeping. New captains are always welcome to pull up a chair.",
    detail: "Guides, event reports and gallery submissions are reviewed by moderators before they go public.",
    image: "/media/sot-tavern.jpg",
    video: "/media/sot-tavern-motion.mp4",
    alt: "The lit window of a tavern on the water at dusk.",
  },
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
      "Post the run you want to sail, or answer someone else's call. Crews appear here only when real players post them.",
    size: "large",
  },
  {
    key: "events",
    title: "Sail together",
    description: "Fleet nights, Fight Nights and community voyages — with times shown in your region.",
    size: "small",
  },
  {
    key: "guides",
    title: "Learn the ropes",
    description: "Short, practical notes from players who have already made the mistakes for you.",
    size: "small",
  },
  {
    key: "gallery",
    title: "Share the view",
    description: "A moderated place for the screenshots, clips and strange sea stories worth keeping.",
    size: "large",
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
    emptyDescription: "No events have been published yet. Scheduled voyages will appear here.",
    reverse: false,
  },
  {
    key: "crewListings",
    eyebrow: "Crew finder",
    title: "No pirate sails alone",
    description:
      "Find a crew for a specific run, a weekly session, or a first voyage. Listings open when members start posting them.",
    emptyTitle: "No crews posted yet",
    emptyDescription: "No crew listings have been posted yet.",
    reverse: true,
  },
  {
    key: "gallery",
    eyebrow: "Gallery",
    title: "Stories worth keeping",
    description:
      "A moderated collection of screenshots and artwork from the community. Every image gets here through review.",
    emptyTitle: "The gallery is waiting",
    emptyDescription: "No media has been approved yet.",
    reverse: false,
  },
  {
    key: "guides",
    eyebrow: "Guides",
    title: "Knowledge passed down",
    description:
      "Practical guides for new and veteran pirates, built from real experience rather than filler.",
    emptyTitle: "No guides published yet",
    emptyDescription: "No guides have been published yet.",
    reverse: true,
  },
  {
    key: "announcements",
    eyebrow: "News",
    title: "Signals from the shore",
    description:
      "Updates from the community team, posted here once there is something genuine to report.",
    emptyTitle: "All quiet for now",
    emptyDescription: "No announcements have been published yet.",
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
    {
      title: "Explore",
      items: [
        ...NAV_LINKS.map((l) => ({ label: l.label, value: l.href })),
        { label: "Voyage tools", value: "/tools" },
      ],
    },
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
        { label: "Rules", value: "/conduct" },
        { label: "Privacy", value: "/privacy" },
        { label: "Terms", value: "/terms" },
        { label: "Security", value: "/security" },
        { label: "Data request", value: "/data-request" },
      ] as FooterItem[],
    },
  ],
} as const;

export const GUIDE_CATEGORIES = [
  "Sailing", "Combat", "PvP", "Trading", "Fishing", "Tall Tales",
  "Emissary", "Seasonal Content", "New Player Help",
] as const;

export const ANNOUNCEMENT_CATEGORIES = [
  "Events", "Updates", "Community News", "Server Rules", "Opportunities",
] as const;

export const GALLERY_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"] as const;
export const GALLERY_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const GALLERY_MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const REPORT_TARGETS = [
  { value: "profile", label: "Member profile" },
  { value: "crew_listing", label: "Crew listing" },
  { value: "event", label: "Event" },
  { value: "comment", label: "Comment" },
  { value: "gallery_item", label: "Gallery item" },
  { value: "guide", label: "Guide" },
  { value: "announcement", label: "Announcement" },
] as const;

export const ROLE_LABELS = {
  member: "Member",
  moderator: "Moderator",
  admin: "Admin",
  owner: "Owner",
} as const;

export const ADMIN_PRIVACY_NOTICE =
  "Moderation actions are private. Only authorized moderators and admins can view reports or change content status. Every sensitive action is written to an audit log.";

export const SECURITY_CONTACT_EMAIL = "";

export const LIVE_SEAS = {
  eyebrow: "Live seas",
  title: "What's sailing right now",
  description: "Real event status and regional timings. Nothing is shown as live until a host publishes it.",
  liveLabel: "Live now",
  nextLabel: "Next on the horizon",
  noLive: "No event is live right now",
  noLiveDetail: "Hosts publish events through the events system. When one starts, it appears here automatically.",
  noNext: "No voyage scheduled yet",
  updatesTitle: "In-game updates",
  updatesDetail: "Community-curated notes only. Official news is never reproduced without permission.",
  noUpdates: "No in-game updates published yet",
  formatsTitle: "Event formats we run",
  formatsDetail: "Each host sets the start time when they publish a voyage, and it is shown in your own region's clock.",
} as const;

export const EVENT_FORMATS = [
  { key: "fight_nights", label: "Fight Nights", note: "Open PvP evenings", timing: "Set by host" },
  { key: "last_ship_standing", label: "Last Ship Standing", note: "Fleet elimination", timing: "Set by host" },
  { key: "fleet_night", label: "Fleet Night", note: "Casual group sailing", timing: "Set by host" },
  { key: "treasure_hunt", label: "Treasure Hunt", note: "Region-wide goal", timing: "Set by host" },
  { key: "stream_night", label: "Stream Night", note: "Community creators", timing: "Set by host" },
  { key: "community_challenge", label: "Community Challenge", note: "Seasonal objective", timing: "Set by host" },
] as const;

export const QUICK_ACTIONS = [
  { label: "Discord invite", href: "https://discord.com/invite/dSX5FNy6sB", external: true },
  { label: "Events calendar", href: "/events", external: false },
  { label: "Find a crew", href: "/crew", external: false },
  { label: "Report an issue", href: "/report", external: false },
  { label: "Voyage checklist", href: "/tools", external: false },
] as const;

export const DISCORD_EVENTS = {
  eyebrow: "From Discord",
  title: "Live event board",
  description: "Events posted by the community bot appear here with artwork, timing and details.",
  empty: "No Discord events have been posted yet. Events appear here when your bot sends them.",
  credit: "Events are displayed exactly as published to the community bot. No Discord messages are copied without permission.",
} as const;

