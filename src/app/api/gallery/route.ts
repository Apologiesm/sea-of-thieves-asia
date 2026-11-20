import { NextResponse } from "next/server";
import { requireUser } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { galleryMetaSchema } from "@/lib/m8/validation";
import { GALLERY_ACCEPTED_TYPES, GALLERY_MAX_IMAGE_BYTES, GALLERY_MAX_VIDEO_BYTES } from "@/lib/content/site-config";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { listGallery } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";
import type { NextRequest } from "next/server";
import { getKillSwitches } from "@/lib/site/layout";

export const dynamic = "force-dynamic";

/** Check file signatures, not just the client-supplied MIME type. */
function validSignature(buffer: Uint8Array, mime: string): boolean {
  const at = (offset: number, bytes: number[]) => bytes.every((byte, index) => buffer[offset + index] === byte);
  if (mime === "image/jpeg") return at(0, [0xff, 0xd8, 0xff]);
  if (mime === "image/png") return at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mime === "image/webp") return at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50]);
  if (mime === "video/mp4") return at(4, [0x66, 0x74, 0x79, 0x70]);
  if (mime === "video/webm") return at(0, [0x1a, 0x45, 0xdf, 0xa3]);
  return false;
}

export async function GET(request: NextRequest) {
  const all = request.nextUrl.searchParams.get("all") === "1";
  if (all) {
    const context = await requireModerator();
    if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ items: await listGallery("pending", true) });
  }
  return NextResponse.json({ items: await listGallery("approved") });
}

export async function POST(request: Request) {
  const context = await requireUser();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { user, supabase } = context;

  const switches = await getKillSwitches();
  if (!switches.galleryUploads || switches.maintenanceMode) {
    return NextResponse.json({ error: "gallery_uploads_disabled" }, { status: 503 });
  }

  if (!rateLimit(`gallery:upload:${user.id}`, LIMITS.galleryUpload.limit, LIMITS.galleryUpload.windowMs).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "invalid_form" }, { status: 400 }); }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });

  if (!GALLERY_ACCEPTED_TYPES.includes(file.type as (typeof GALLERY_ACCEPTED_TYPES)[number])) {
    return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  }
  const max = file.type.startsWith("video/") ? GALLERY_MAX_VIDEO_BYTES : GALLERY_MAX_IMAGE_BYTES;
  if (file.size > max) return NextResponse.json({ error: "file_too_large" }, { status: 400 });

  const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!validSignature(signature, file.type)) {
    return NextResponse.json({ error: "file_signature_mismatch" }, { status: 400 });
  }

  const meta = galleryMetaSchema.safeParse({
    caption: form.get("caption") ?? "",
    altText: form.get("altText") ?? "",
  });
  if (!meta.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const storagePath = `user/${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from("gallery")
    .upload(storagePath, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { data, error } = await supabase.from("gallery_items").insert({
    uploader_id: user.id,
    storage_path: storagePath,
    caption: meta.data.caption || null,
    alt_text: meta.data.altText,
    status: "pending",
  }).select("*").single();

  if (error) {
    await admin.storage.from("gallery").remove([storagePath]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
