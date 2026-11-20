import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const context = await requireModerator();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (!ACCEPTED.includes(file.type)) return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file_too_large" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await admin.storage.from("covers").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = admin.storage.from("covers").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
