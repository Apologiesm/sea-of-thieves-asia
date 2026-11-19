import type { Metadata } from "next";
import { SectionPage } from "@/components/layout/section-page";

export const metadata: Metadata = {
  title: "Announcements",
  description: "News and updates from Sea of Thieves Asia (beta).",
};

export default function AnnouncementsPage() {
  return (
    <SectionPage
      title="Announcements"
      description="News and updates from the community team will appear here."
    />
  );
}
