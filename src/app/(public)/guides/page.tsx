import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/section-page";

export const metadata: Metadata = {
  title: "Guides",
  description: "Knowledge base for Sea of Thieves Asia (beta).",
};

export default function GuidesPage() {
  return (
    <SectionPage
      title="Guides"
      description="A knowledge base for new and veteran pirates will live here."
    />
  );
}
