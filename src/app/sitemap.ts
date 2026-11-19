import type { MetadataRoute } from "next";
import { NAV_LINKS } from "@/lib/content/site-config";
import { getSiteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    ...NAV_LINKS.map((link) => ({
      url: `${base}${link.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
