export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventType =
  | "fleet_night"
  | "pvp_tournament"
  | "treasure_hunt"
  | "new_captain_orientation"
  | "stream_night"
  | "community_challenge";
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
};
