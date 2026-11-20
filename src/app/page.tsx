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

  return (
    <>
      <Hero />
      <LiveSeas />
      <OfficialUpdates limit={6} />
      {settings.features.discordEvents ? <DiscordEvents limit={6} /> : null}
      <About />
      <CommunityFeatures />
      <div id="sections">
        {previews.map((preview, index) => (
          <PreviewSection key={preview.key} preview={preview} index={index} />
        ))}
      </div>
      <JoinCta />
      <VoyageProgress />
      <VoyageScrollController />
    </>
  );
}
