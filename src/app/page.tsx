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

export default function HomePage() {
  return (
    <>
      <Hero />
      <LiveSeas />
      <OfficialUpdates limit={6} />
      <DiscordEvents limit={6} />
      <About />
      <CommunityFeatures />
      <div id="sections">
        {PREVIEWS.map((preview, index) => (
          <PreviewSection key={preview.key} preview={preview} index={index} />
        ))}
      </div>
      <JoinCta />
      <VoyageProgress />
      <VoyageScrollController />
    </>
  );
}
