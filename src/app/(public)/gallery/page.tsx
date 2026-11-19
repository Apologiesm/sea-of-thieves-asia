import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/section-page";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Community gallery for Sea of Thieves Asia (beta).",
};

export default function GalleryPage() {
  return (
    <SectionPage
      title="Gallery"
      description="Screenshots and artwork from the community will be shown here."
    />
  );
}
