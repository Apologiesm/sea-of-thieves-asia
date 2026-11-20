import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BackToTop } from "@/components/content/BackToTop";
import { VideoLayer } from "@/components/visuals/VideoLayer";
import { NAV_LINKS, SITE } from "@/lib/content/site-config";
import { getSiteSettings } from "@/lib/site/settings";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
  twitter: {
    card: "summary",
    title: SITE.name,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const settings = await getSiteSettings();
  const flagByHref: Record<string, keyof typeof settings.features> = {
    "/events": "events",
    "/crew": "crew",
    "/guides": "guides",
    "/gallery": "gallery",
    "/announcements": "news",
  };
  const navLinks = NAV_LINKS.filter((link) => {
    const flag = flagByHref[link.href];
    return !flag || settings.features[flag];
  });

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <VideoLayer src="/media/sot2-page.mp4" poster="/media/sot2-page.jpg" variant="page" />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
        >
          Skip to content
        </a>
        <SiteHeader navLinks={navLinks} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter navLinks={navLinks} />
        <BackToTop />
      </body>
    </html>
  );
}
