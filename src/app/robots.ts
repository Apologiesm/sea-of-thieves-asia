import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const host = getSiteUrl();

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    host,
    sitemap: `${host}/sitemap.xml`,
  };
}
