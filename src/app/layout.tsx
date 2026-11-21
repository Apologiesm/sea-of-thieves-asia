import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BackToTop } from "@/components/content/BackToTop";
import { HoverGlowController } from "@/components/ui/HoverGlowController";
import { TimeZoneProvider } from "@/components/system/time-zone-provider";
import { LiveRefresh } from "@/components/system/live-refresh";
import { getViewerTimeZone } from "@/lib/time/viewer";
import { NAV_LINKS, SITE } from "@/lib/content/site-config";
import { getSiteSettings } from "@/lib/site/settings";
import { getLayoutConfig } from "@/lib/site/layout";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

/**
 * Windlass, the owner-supplied display face. It ships one weight, so everything
 * on the site reads in the same stroke: hierarchy comes from size, spacing and
 * colour rather than from a fake bold. Self-hosted through next/font/local, so
 * there is no third-party request and no layout shift while it loads.
 */
const windlass = localFont({
  src: "./fonts/Windlass.ttf",
  display: "swap",
  weight: "400",
  style: "normal",
  variable: "--font-windlass",
  fallback: ["Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
});

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
  const [settings, layout, timeZone] = await Promise.all([
    getSiteSettings(),
    getLayoutConfig(),
    getViewerTimeZone(),
  ]);
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
  })
    .slice()
    .sort((a, b) => {
      const order = layout.nav.order;
      const ai = order.indexOf(a.href);
      const bi = order.indexOf(b.href);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  return (
    <html lang="en" className={windlass.variable}>
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <TimeZoneProvider initial={timeZone}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
        >
          Skip to content
        </a>
        <SiteHeader navLinks={navLinks} />
        {layout.killSwitches.maintenanceMode ? (
          <div
            role="status"
            className="relative z-20 border-b border-brand/40 bg-surface-raised px-4 py-2.5 text-center text-xs text-content"
          >
            Maintenance mode is on — community sections are read-only right now. Admins can still manage content.
          </div>
        ) : null}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter navLinks={navLinks} />
        <HoverGlowController />
        <BackToTop />
        <LiveRefresh />
        </TimeZoneProvider>
      </body>
    </html>
  );
}
