import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { MarkdownView } from "@/components/content/MarkdownView";
import { Comments } from "@/components/content/Comments";
import { ReportButton } from "@/components/content/ReportButton";
import { getGuide } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Guide" };

export default async function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guide = await getGuide(id);
  if (!guide) notFound();
  const canEdit = Boolean(await requireModerator());

  return (
    <>
      <PageHeader eyebrow={guide.category ?? "Guide"} title={guide.title} description={guide.excerpt ?? "Community guide"} />
      <Container>
        <div className="grid gap-8 py-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="accent">{guide.status}</Badge>
                  {(guide.tags ?? []).map((tag) => <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-content-muted">{tag}</span>)}
                </div>
                <span className="text-xs text-content-muted">{guide.reading_minutes} min read · updated {new Date(guide.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-6"><MarkdownView content={guide.body} /></div>
            </Card>
            <Comments targetType="guide" targetId={id} />
          </div>
          <div className="lg:col-span-4">
            <Card>
              <p className="text-xs uppercase tracking-wide text-content-muted">Author</p>
              <p className="mt-2 text-sm text-content">{guide.author_name ?? "Community member"}</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-content-muted">Last updated</p>
              <p className="mt-2 text-sm text-content">{new Date(guide.updated_at).toLocaleString()}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {canEdit ? <Link href={`/guides/${id}/edit`} className="min-h-11 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas">Edit guide</Link> : null}
                <ReportButton targetType="guide" targetId={id} />
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
