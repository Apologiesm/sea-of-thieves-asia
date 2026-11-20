import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnnouncementRecord, AuditRecord, CommentRecord, GalleryItem, GuideRecord, ReportRecord,
} from "@/lib/m8/types";

export type GuideFilters = { q: string; category: string; tag: string; author: string };

export async function listGuides(filters: GuideFilters, includeAll = false): Promise<GuideRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase.from("guides").select("*").order("updated_at", { ascending: false }).limit(100);
  if (!includeAll) query = query.eq("status", "published");
  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,excerpt.ilike.%${filters.q}%`);
  if (filters.category) query = query.ilike("category", `%${filters.category}%`);
  if (filters.tag) query = query.contains("tags", [filters.tag]);
  if (filters.author) query = query.ilike("author_name", `%${filters.author}%`);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as GuideRecord[];
}

export async function getGuide(id: string): Promise<GuideRecord | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("guides").select("*").eq("id", id).maybeSingle();
  return data ? (data as GuideRecord) : null;
}

export async function listAnnouncements(includeAll = false): Promise<AnnouncementRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  let query = supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(100);
  if (!includeAll) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as AnnouncementRecord[];
}

export async function getAnnouncement(id: string): Promise<AnnouncementRecord | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("announcements").select("*").eq("id", id).maybeSingle();
  return data ? (data as AnnouncementRecord) : null;
}

function publicUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/gallery/${path}`;
}

export async function listGallery(status: "approved" | "pending" | "rejected" = "approved", includeAll = false): Promise<GalleryItem[]> {
  const client = includeAll ? createAdminClient() : await createClient();
  if (!client) return [];
  let query = client.from("gallery_items").select("*").order("created_at", { ascending: false }).limit(100);
  if (!includeAll) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as GalleryItem[]).map((item) => ({ ...item, publicUrl: publicUrl(item.storage_path) }));
}

export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("gallery_items").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const item = data as GalleryItem;
  return { ...item, publicUrl: publicUrl(item.storage_path) };
}

export async function listReports(status?: string): Promise<ReportRecord[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  let query = admin.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
  if (status && status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as ReportRecord[];
}

export async function listAuditLog(limit = 100): Promise<AuditRecord[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as AuditRecord[];
}

export async function listComments(targetType: string, targetId: string): Promise<CommentRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return [];
  return (data ?? []) as CommentRecord[];
}
