/**
 * Shared definition of every content type the master control panel can edit.
 * Used by the server API (column allow-list) and the client UI (form fields),
 * so both stay in lock-step. No server-only imports here.
 */

export type ContentType =
  | "events"
  | "guides"
  | "announcements"
  | "gallery_items"
  | "crew_listings"
  | "comments"
  | "official_updates";

export type FieldKey =
  | "title"
  | "body"
  | "excerpt"
  | "caption"
  | "category"
  | "tags"
  | "author"
  | "image"
  | "status"
  | "startsAt"
  | "endsAt"
  | "sortOrder"
  | "enabled"
  | "featured"
  | "pinned";

export type FieldSpec = {
  /** Database column name. */
  column: string;
  label: string;
  kind: "text" | "textarea" | "number" | "boolean" | "datetime" | "image" | "select" | "tags";
  options?: readonly string[];
  hint?: string;
};

export type ContentTypeSpec = {
  type: ContentType;
  table: string;
  label: string;
  /** Title-ish column used for lists and delete confirmations. */
  titleColumn: string | null;
  fields: Partial<Record<FieldKey, FieldSpec>>;
};

export const CONTENT_TYPES: Record<ContentType, ContentTypeSpec> = {
  events: {
    type: "events",
    table: "events",
    label: "Events",
    titleColumn: "title",
    fields: {
      title: { column: "title", label: "Title", kind: "text" },
      body: { column: "description", label: "Description", kind: "textarea" },
      image: { column: "image_url", label: "Image", kind: "image" },
      status: {
        column: "status",
        label: "Status",
        kind: "select",
        options: ["draft", "published", "cancelled", "completed"],
      },
      startsAt: { column: "starts_at", label: "Starts at", kind: "datetime" },
      endsAt: { column: "ends_at", label: "Ends at", kind: "datetime" },
      author: { column: "created_by", label: "Host (author)", kind: "text", hint: "Profile UUID" },
      sortOrder: { column: "sort_order", label: "Sort order", kind: "number" },
      enabled: { column: "is_enabled", label: "Visible on site", kind: "boolean" },
      featured: { column: "is_featured", label: "Pinned / featured", kind: "boolean" },
    },
  },
  guides: {
    type: "guides",
    table: "guides",
    label: "Guides",
    titleColumn: "title",
    fields: {
      title: { column: "title", label: "Title", kind: "text" },
      body: { column: "body", label: "Body (markdown)", kind: "textarea" },
      excerpt: { column: "excerpt", label: "Excerpt", kind: "text" },
      category: { column: "category", label: "Category", kind: "text" },
      tags: { column: "tags", label: "Tags", kind: "tags", hint: "Comma separated" },
      image: { column: "image_url", label: "Cover image", kind: "image" },
      author: { column: "author_id", label: "Author", kind: "text", hint: "Profile UUID" },
      status: {
        column: "status",
        label: "Status",
        kind: "select",
        options: ["draft", "published", "archived"],
      },
      sortOrder: { column: "sort_order", label: "Sort order", kind: "number" },
      enabled: { column: "is_enabled", label: "Visible on site", kind: "boolean" },
      featured: { column: "is_featured", label: "Pinned / featured", kind: "boolean" },
    },
  },
  announcements: {
    type: "announcements",
    table: "announcements",
    label: "News & announcements",
    titleColumn: "title",
    fields: {
      title: { column: "title", label: "Title", kind: "text" },
      body: { column: "body", label: "Body (markdown)", kind: "textarea" },
      category: { column: "category", label: "Category", kind: "text" },
      image: { column: "cover_image_url", label: "Cover image", kind: "image" },
      author: { column: "author_id", label: "Author", kind: "text", hint: "Profile UUID" },
      status: {
        column: "status",
        label: "Status",
        kind: "select",
        options: ["draft", "published", "archived"],
      },
      pinned: { column: "pinned", label: "Pin to top", kind: "boolean" },
      sortOrder: { column: "sort_order", label: "Sort order", kind: "number" },
      enabled: { column: "is_enabled", label: "Visible on site", kind: "boolean" },
      featured: { column: "is_featured", label: "Featured", kind: "boolean" },
    },
  },
  gallery_items: {
    type: "gallery_items",
    table: "gallery_items",
    label: "Gallery",
    titleColumn: "caption",
    fields: {
      caption: { column: "caption", label: "Caption", kind: "text" },
      excerpt: { column: "alt_text", label: "Alt text", kind: "text" },
      author: { column: "author_id", label: "Uploader", kind: "text", hint: "Profile UUID" },
      status: {
        column: "status",
        label: "Status",
        kind: "select",
        options: ["pending", "approved", "rejected"],
      },
      sortOrder: { column: "sort_order", label: "Sort order", kind: "number" },
      enabled: { column: "is_enabled", label: "Visible on site", kind: "boolean" },
      featured: { column: "is_featured", label: "Highlight", kind: "boolean" },
    },
  },
  crew_listings: {
    type: "crew_listings",
    table: "crew_listings",
    label: "Crew / LFG",
    titleColumn: "title",
    fields: {
      title: { column: "title", label: "Title", kind: "text" },
      body: { column: "description", label: "Description", kind: "textarea" },
      image: { column: "image_url", label: "Banner image", kind: "image" },
      author: { column: "author_id", label: "Author", kind: "text", hint: "Profile UUID" },
      status: {
        column: "status",
        label: "Status",
        kind: "select",
        options: ["open", "closed", "hidden", "removed"],
      },
      sortOrder: { column: "sort_order", label: "Sort order", kind: "number" },
      enabled: { column: "is_enabled", label: "Visible on site", kind: "boolean" },
      featured: { column: "is_featured", label: "Pinned / featured", kind: "boolean" },
    },
  },
  comments: {
    type: "comments",
    table: "comments",
    label: "Comments",
    titleColumn: "body",
    fields: {
      body: { column: "body", label: "Comment", kind: "textarea" },
      author: { column: "author_id", label: "Author", kind: "text", hint: "Profile UUID" },
      status: { column: "status", label: "Status", kind: "text" },
      sortOrder: { column: "sort_order", label: "Sort order", kind: "number" },
      enabled: { column: "is_enabled", label: "Visible on site", kind: "boolean" },
    },
  },
  official_updates: {
    type: "official_updates",
    table: "official_updates",
    label: "Official SoT news",
    titleColumn: "title",
    fields: {
      title: { column: "title", label: "Title", kind: "text" },
      excerpt: { column: "summary", label: "Summary", kind: "textarea" },
      image: { column: "image_url", label: "Image", kind: "image" },
      featured: { column: "featured", label: "Feature at top", kind: "boolean" },
      enabled: { column: "is_enabled", label: "Visible on site", kind: "boolean" },
      sortOrder: { column: "sort_order", label: "Sort order", kind: "number" },
    },
  },
};

export const CONTENT_TYPE_LIST = Object.values(CONTENT_TYPES);

/** Allowed column names for a type, derived from its field spec. */
export function allowedColumns(spec: ContentTypeSpec): string[] {
  return Object.values(spec.fields)
    .map((field) => field?.column)
    .filter((column): column is string => Boolean(column));
}
