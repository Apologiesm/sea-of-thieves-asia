import type { ReactNode } from "react";
import { About } from "@/components/sections/about";
import { CommunityFeatures } from "@/components/sections/features";
import { Hero } from "@/components/sections/hero";
import { JoinCta } from "@/components/sections/join-cta";
import { LiveSeas } from "@/components/live/LiveSeas";
import { OfficialUpdates } from "@/components/official/OfficialUpdates";
import { DiscordEvents } from "@/components/discord/DiscordEvents";
import { PreviewSection } from "@/components/sections/preview-section";
import { VoyageProgress } from "@/components/scroll/VoyageProgress";
import { VoyageScrollController } from "@/components/scroll/VoyageScrollController";
import { PREVIEWS } from "@/lib/content/site-config";
import { getSiteSettings } from "@/lib/site/settings";

const DEFAULT_ORDER = ["live", "news", "discord", "about", "features", "previews", "join"];

export default async function HomePage() {
  const settings = await getSiteSettings();
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

  const order = settings.home.sectionOrder?.length ? settings.home.sectionOrder : DEFAULT_ORDER;
  const finalOrder = [...order, ...DEFAULT_ORDER.filter((key) => !order.includes(key))];

  return (
    <>
      <Hero />
      {finalOrder.map((key) => (
        <div key={key} data-section={key}>{sections[key]}</div>
      ))}
      <VoyageProgress />
      <VoyageScrollController />
    </>
  );
}
