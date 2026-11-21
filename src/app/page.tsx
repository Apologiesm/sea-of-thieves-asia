import type { ReactNode } from "react";
import { About } from "@/components/sections/about";
import { CommunityFeatures } from "@/components/sections/features";
import { Hero } from "@/components/sections/hero";
import { JoinCta } from "@/components/sections/join-cta";
import { LiveSeas } from "@/components/live/LiveSeas";
import { OfficialUpdates } from "@/components/official/OfficialUpdates";
import { DiscordEvents } from "@/components/discord/DiscordEvents";
import { PreviewSection } from "@/components/sections/preview-section";
import { CinematicVoyage } from "@/components/sections/cinematic-voyage";
import { VoyageProgress } from "@/components/scroll/VoyageProgress";
import { VoyageScrollController } from "@/components/scroll/VoyageScrollController";
import { PREVIEWS } from "@/lib/content/site-config";
import { getSiteSettings } from "@/lib/site/settings";
import { getLayoutConfig } from "@/lib/site/layout";

const DEFAULT_ORDER = [
  "horizon",
  "fleet",
  "tavern",
  "live",
  "news",
  "discord",
  "about",
  "features",
  "previews",
  "join",
];

export default async function HomePage() {
  const settings = await getSiteSettings();
  const layout = await getLayoutConfig();
  const flagByKey: Record<string, keyof typeof settings.features> = {
    events: "events",
    crew: "crew",
    gallery: "gallery",
    guides: "guides",
    announcements: "news",
  };
  const previews = PREVIEWS.filter((preview) => {
    const flag = flagByKey[preview.key];
    return !flag || settings.features[flag];
  });

  const sections: Record<string, ReactNode> = {
    // The three cinematic scenes are rendered as one continuous sequence so
    // their parallax layers stay in a single scroll context.
    horizon: null,
    fleet: null,
    tavern: null,
    live: settings.features.events ? <LiveSeas /> : null,
    news: settings.features.news ? <OfficialUpdates limit={6} /> : null,
    discord: settings.features.discordEvents ? <DiscordEvents limit={6} /> : null,
    about: <About />,
    features: <CommunityFeatures />,
    previews: (
      <div id="sections">
        {previews.map((preview, index) => (
          <PreviewSection key={preview.key} preview={preview} index={index} />
        ))}
      </div>
    ),
    join: <JoinCta />,
  };

  const cinematicKeys = ["horizon", "fleet", "tavern"];

  const savedOrder = layout.home.order?.length
    ? layout.home.order
    : settings.home.sectionOrder?.length
      ? settings.home.sectionOrder
      : DEFAULT_ORDER;
  // Older saved orders predate the cinematic scenes: keep them directly after
  // the hero so the page still opens with the Horizon -> Fleet -> Tavern arc.
  const missingCinematic = cinematicKeys.filter((key) => !savedOrder.includes(key));
  const order = [
    ...missingCinematic,
    ...savedOrder,
    ...DEFAULT_ORDER.filter((key) => !savedOrder.includes(key) && !missingCinematic.includes(key)),
  ];
  const hidden = new Set(layout.home.hidden);
  const finalOrder = order.filter((key) => !hidden.has(key));

  const showCinematic = cinematicKeys.some((key) => finalOrder.includes(key));

  // The three scenes render as one sequenced block, placed where the owner put
  // the first cinematic section in the homepage order.
  const rendered: ReactNode[] = [];
  let cinematicPlaced = false;
  for (const key of finalOrder) {
    if (cinematicKeys.includes(key)) {
      if (showCinematic && !cinematicPlaced) {
        rendered.push(<CinematicVoyage key="cinematic-voyage" />);
        cinematicPlaced = true;
      }
      continue;
    }
    rendered.push(
      <div key={key} data-section={key}>
        {sections[key]}
      </div>,
    );
  }

  return (
    <>
      <Hero />
      {layout.killSwitches.maintenanceMode ? (
        <section aria-labelledby="maintenance-title" className="border-b border-border">
          <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Shipyard maintenance</p>
            <h2 id="maintenance-title" className="mt-4 text-2xl font-semibold text-content sm:text-3xl">
              We&apos;re careening the hull
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-content-muted">
              Community sections are temporarily offline while the crew makes repairs. Check back shortly.
            </p>
          </div>
        </section>
      ) : (
        rendered
      )}
      <VoyageProgress />
      <VoyageScrollController />
    </>
  );
}
