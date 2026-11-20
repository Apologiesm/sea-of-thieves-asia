import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { GalleryGrid } from "@/components/content/GalleryGrid";
import { listGallery } from "@/lib/m8/queries";

export const metadata: Metadata = { title: "Gallery", description: "Community gallery with moderation." };

export default async function GalleryPage() {
  const items = await listGallery("approved");
  return (
    <>
      <PageHeader eyebrow="Gallery" title="Community gallery" description="Screenshots and videos shared by members and approved by moderators." />
      <Container>
        <div className="py-10 sm:py-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-content-muted">{items.length} approved {items.length === 1 ? "item" : "items"}</p>
            <ButtonLink href="/gallery/upload">Upload media</ButtonLink>
          </div>
          {items.length === 0 ? (
            <EmptyState title="Gallery is empty" description="No approved media yet. Uploads are reviewed before they appear here." />
          ) : (
            <GalleryGrid items={items} />
          )}
        </div>
      </Container>
    </>
  );
}
