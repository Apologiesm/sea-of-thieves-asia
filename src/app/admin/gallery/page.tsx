import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { GalleryModeration } from "@/components/content/GalleryModeration";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Gallery moderation" };

export default async function AdminGalleryPage() {
  const allowed = Boolean(await requireModerator());
  return (
    <>
      <PageHeader eyebrow="Administration" title="Gallery moderation" description="Approve or reject community uploads." />
      <Container><div className="py-10 sm:py-14">{allowed ? <GalleryModeration /> : <Card><p className="text-sm text-content-muted">Moderator access required.</p></Card>}</div></Container>
    </>
  );
}
