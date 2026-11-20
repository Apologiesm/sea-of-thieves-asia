export type CrewListing = {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  region: string | null;
  platform: string | null;
  languages: string[] | null;
  playstyle: string | null;
  ship_preference: string | null;
  role_preference: string | null;
  availability: string | null;
  seats_total: number;
  seats_filled: number;
  status: "open" | "closed" | "hidden" | "removed";
  contact_consent: boolean;
  contact_method: string | null;
  image_url: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CrewFilters = {
  q: string;
  region: string;
  platform: string;
  language: string;
  playstyle: string;
  shipPreference: string;
  rolePreference: string;
  availability: string;
};
