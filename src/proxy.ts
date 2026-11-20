import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function isAllowedOrigin(origin: string, request: NextRequest): boolean {
  const allowed = new Set<string>([request.nextUrl.origin]);

  // Localhost origins are only trusted during local development.
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      allowed.add(new URL(configured).origin);
    } catch {
      // Malformed configuration is ignored; request origin still applies.
    }
  }

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) allowed.add(`https://${vercelHost.replace(/\/$/, "")}`);

  return allowed.has(origin);
}

/** Next.js 16 proxy: session refresh + central CSRF guard. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (MUTATING.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && !isAllowedOrigin(origin, request)) {
      return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
