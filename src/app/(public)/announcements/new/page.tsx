import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { AnnouncementForm } from "@/components/content/AnnouncementForm";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Write announcement" };

export default async function NewAnnouncementPage() {
  if (!await requireModerator()) redirect("/login");
  return (
    <>
      <PageHeader eyebrow="News" title="Write announcement" description="Admin-published news. Markdown is supported." />
      <Container><div className="max-w-4xl py-12"><AnnouncementForm /></div></Container>
    </>
  );
}
