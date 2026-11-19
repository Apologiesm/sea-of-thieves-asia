import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/section-page";

export const metadata: Metadata = {
  title: "Events",
  description: "Community events for Sea of Thieves Asia (beta).",
};

export default function EventsPage() {
  return (
    <SectionPage
      title="Events"
      description="Community voyages, meetups, and activities will be listed here."
    />
  );
}
