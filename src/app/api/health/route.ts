import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { status: "unconfigured", message: "Supabase environment variables are not set." },
      { status: 503 },
    );
  }

  const { error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 502 },
    );
  }

  return NextResponse.json({
    status: "ok",
    database: "supabase",
    rls: "enforced",
  });
}
