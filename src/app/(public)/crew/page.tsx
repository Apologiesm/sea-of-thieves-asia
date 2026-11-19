import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/section-page";

export const metadata: Metadata = {
  title: "Crew Listings",
  description: "Crew listings for Sea of Thieves Asia (beta).",
};

export default function CrewPage() {
  return (
    <SectionPage
      title="Crew Listings"
      description="Find a crew for your next voyage when listings are available."
    />
  );
}
