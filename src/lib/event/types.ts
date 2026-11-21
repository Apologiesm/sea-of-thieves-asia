export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventType =
  | "fight_nights"
  | "last_ship_standing"
  | "fleet_night"
  | "treasure_hunt"
  | "stream_night"
  | "community_challenge"
  // Legacy values kept so existing rows still type-check and render.
  | "pvp_tournament"
  | "new_captain_orientation";
export type RsvpStatus = "going" | "maybe" | "cant_go";

export type EventRecord = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_type: EventType | null;
  region: string | null;
  platform: string | null;
  timezone: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  discord_event_url: string | null;
  image_url: string | null;
  max_attendees: number | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EventFilters = {
  type: string;
  region: string;
  platform: string;
  date: string;
  status: string;
  /** "upcoming" | "past" | "" (no time filter). */
  when: string;
};
