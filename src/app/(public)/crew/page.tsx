import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/section-page";
import { getPreview, getSection } from "@/lib/content/site-config";

const section = getSection("crewListings");
const preview = getPreview("crewListings");

export const metadata: Metadata = {
  title: section.title,
  description: section.description,
};

export default function CrewPage() {
  return (
    <SectionPage
      title={section.title}
      description={preview.description}
      eyebrow={preview.eyebrow}
      emptyTitle={preview.emptyTitle}
      emptyDescription={preview.emptyDescription}
    />
  );
}
