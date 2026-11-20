import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { MarkdownView } from "@/components/content/MarkdownView";
import { ReportButton } from "@/components/content/ReportButton";
import { getAnnouncement } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Announcement" };

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getAnnouncement(id);
  if (!item) notFound();
  const canEdit = Boolean(await requireModerator());

  return (
    <>
      <PageHeader eyebrow={item.category ?? "News"} title={item.title} description={item.pinned ? "Pinned announcement" : "Community announcement"} />
      <Container>
        <div className="grid gap-8 py-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="accent">{item.status}</Badge>
                <span className="text-xs text-content-muted">{item.published_at ? new Date(item.published_at).toLocaleString() : "Draft"}</span>
              </div>
              <div className="mt-6"><MarkdownView content={item.body} /></div>
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card>
              <p className="text-xs uppercase text-content-muted">Published by</p>
              <p className="mt-2 text-sm text-content">{item.author_name ?? "Community team"}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {canEdit ? <Link href={`/announcements/${id}/edit`} className="min-h-11 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas">Edit</Link> : null}
                <ReportButton targetType="announcement" targetId={id} />
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
