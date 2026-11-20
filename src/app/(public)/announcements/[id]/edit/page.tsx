import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { AnnouncementForm } from "@/components/content/AnnouncementForm";
import { getAnnouncement } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Edit announcement" };

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await requireModerator()) redirect("/login");
  const item = await getAnnouncement(id);
  if (!item) notFound();
  return (
    <>
      <PageHeader eyebrow="News" title="Edit announcement" description="Changes are server-authorized and audit-logged." />
      <Container><div className="max-w-4xl py-12"><AnnouncementForm announcement={item} /></div></Container>
    </>
  );
}
