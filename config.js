/*
 * Sea of Thieves Asia — site configuration
 *
 * BETA CONTRACT (see docs/content.md):
 * - Every placeholder value MUST be exactly "REPLACE_BEFORE_LAUNCH".
 * - Do not replace a placeholder with a guessed/real-looking URL.
 * - Collections that have no beta data stay "EMPTY_FOR_BETA".
 * - app.js renders these as "Coming soon" — never as fake content.
 */
window.SITE_CONFIG = {
  name: "Sea of Thieves Asia",
  status: "beta",

  // Social / contact links — all placeholders until launch.
  links: {
    discord: "REPLACE_BEFORE_LAUNCH",
    youtube: "REPLACE_BEFORE_LAUNCH",
    twitch: "REPLACE_BEFORE_LAUNCH",
    x: "REPLACE_BEFORE_LAUNCH",
    instagram: "REPLACE_BEFORE_LAUNCH",
    tiktok: "REPLACE_BEFORE_LAUNCH",
    email: "REPLACE_BEFORE_LAUNCH"
  },

  // Collections with no beta data. Do not seed sample entries.
  collections: {
    events: "EMPTY_FOR_BETA",
    gallery: "EMPTY_FOR_BETA",
    guides: "EMPTY_FOR_BETA",
    announcements: "EMPTY_FOR_BETA",
    crewListings: "EMPTY_FOR_BETA"
  },

  messages: {
    comingSoon: "Coming soon",
    emptyCollection: "Coming soon — nothing here yet."
  }
};
