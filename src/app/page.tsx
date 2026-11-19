import { About } from "@/components/sections/about";
import { CommunityFeatures } from "@/components/sections/features";
import { Hero } from "@/components/sections/hero";
import { JoinCta } from "@/components/sections/join-cta";
import { PreviewSection } from "@/components/sections/preview-section";
import { VoyageScrollController } from "@/components/scroll/VoyageScrollController";
import { PREVIEWS } from "@/lib/content/site-config";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <CommunityFeatures />
      <div id="sections">
        {PREVIEWS.map((preview, index) => (
          <PreviewSection key={preview.key} preview={preview} index={index} />
        ))}
      </div>
      <JoinCta />
      <VoyageScrollController />
    </>
  );
}
