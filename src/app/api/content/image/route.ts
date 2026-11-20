import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModerator, requireUser } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Shared image upload endpoint used by MediaPasteUploader across every form.
 *
 * Buckets:
 * - `covers`  (public): announcement covers; moderators and up only.
 * - `media`   (public): any signed-in member; event/crew/guide images.
 *
 * Returns a permanent public URL — never a base64 blob — so database rows
 * only ever store the URL string.
 */
const bucketSchema = z.enum(["covers", "media"]).default("covers");

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const parsedBucket = bucketSchema.safeParse(form?.get("bucket") ?? undefined);
  const bucket = parsedBucket.success ? parsedBucket.data : "covers";

  const context = bucket === "covers" ? await requireModerator() : await requireUser();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (!ACCEPTED.includes(file.type)) return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file_too_large" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "pasted-image.png";
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, bucket });
}
