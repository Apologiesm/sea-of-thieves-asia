import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { ReportButton } from "@/components/content/ReportButton";
import { getGalleryItem } from "@/lib/m8/queries";

export const metadata: Metadata = { title: "Gallery item" };

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getGalleryItem(id);
  if (!item) notFound();

  return (
    <>
      <PageHeader eyebrow="Gallery" title={item.caption ?? "Community submission"} description={item.alt_text ?? "No alt text provided."} />
      <Container>
        <div className="max-w-4xl py-12">
          <Card>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              {item.publicUrl && !/\.(mp4|webm)$/i.test(item.storage_path) ? (
                <Image src={item.publicUrl} alt={item.alt_text ?? ""} fill sizes="100vw" className="object-contain" />
              ) : item.publicUrl ? (
                <video src={item.publicUrl} controls className="h-full w-full object-contain" />
              ) : null}
            </div>
            <p className="mt-4 text-sm text-content">{item.caption ?? "Untitled"}</p>
            <p className="mt-2 text-sm text-content-muted">{item.alt_text}</p>
            <div className="mt-6"><ReportButton targetType="gallery_item" targetId={id} /></div>
          </Card>
        </div>
      </Container>
    </>
  );
}
