import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { listAnnouncements } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Manage announcements" };

export default async function AdminAnnouncementsPage() {
  if (!await requireModerator()) {
    return <Container><div className="py-16"><Card><p className="text-sm text-content-muted">Moderator access required.</p></Card></div></Container>;
  }
  const items = await listAnnouncements(true);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Manage announcements" description="All news, including drafts and archived items." />
      <Container>
        <div className="py-10 sm:py-14">
          <div className="mb-8 flex justify-end"><ButtonLink href="/announcements/new">Write announcement</ButtonLink></div>
          <div className="grid gap-3">
            {items.length === 0 ? <Card><p className="text-sm text-content-muted">No announcements yet.</p></Card> : null}
            {items.map((item) => (
              <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-sm font-semibold text-content">{item.title}</p><p className="text-xs text-content-muted">{item.status} · {item.category} · pinned: {String(item.pinned)}</p></div>
                <Link href={`/announcements/${item.id}/edit`} className="min-h-11 inline-flex items-center text-sm text-content underline underline-offset-4">Edit</Link>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
