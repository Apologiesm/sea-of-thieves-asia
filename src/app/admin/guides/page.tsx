import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { listGuides } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Manage guides" };

export default async function AdminGuidesPage() {
  if (!await requireModerator()) {
    return <Container><div className="py-16"><Card><p className="text-sm text-content-muted">Moderator access required.</p></Card></div></Container>;
  }
  const guides = await listGuides({ q: "", category: "", tag: "", author: "" }, true);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Manage guides" description="Draft, published and archived guides." />
      <Container>
        <div className="py-10 sm:py-14">
          <div className="mb-8 flex justify-end"><ButtonLink href="/guides/new">Write guide</ButtonLink></div>
          <div className="grid gap-3">
            {guides.length === 0 ? <Card><p className="text-sm text-content-muted">No guides yet.</p></Card> : null}
            {guides.map((guide) => (
              <Card key={guide.id} className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-sm font-semibold text-content">{guide.title}</p><p className="text-xs text-content-muted">{guide.status} · {guide.category}</p></div>
                <Link href={`/guides/${guide.id}/edit`} className="min-h-11 inline-flex items-center text-sm text-content underline underline-offset-4">Edit</Link>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
