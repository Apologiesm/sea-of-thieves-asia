export type GuideRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  category: string | null;
  tags: string[] | null;
  reading_minutes: number;
  author_id: string | null;
  author_name: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementRecord = {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string | null;
  author_name: string | null;
  pinned: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  uploader_id: string;
  storage_path: string;
  caption: string | null;
  alt_text: string | null;
  status: "pending" | "approved" | "rejected";
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
  publicUrl?: string | null;
};

export type ReportRecord = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
};

export type AuditRecord = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CommentRecord = {
  id: string;
  target_type: string;
  target_id: string;
  author_id: string;
  body: string;
  status: string;
  created_at: string;
};
