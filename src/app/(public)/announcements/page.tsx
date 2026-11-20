import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { AnnouncementCard } from "@/components/content/AnnouncementCard";
import { OfficialUpdates } from "@/components/official/OfficialUpdates";
import { DiscordAnnouncements } from "@/components/discord/DiscordAnnouncements";
import { listAnnouncements } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const [items, canEdit] = await Promise.all([listAnnouncements(), requireModerator().then(Boolean)]);
  return (
    <>
      <PageHeader eyebrow="News" title="Announcements" description="Official community news, events, rules and opportunities." />
      <OfficialUpdates limit={6} />
      <DiscordAnnouncements />
      <Container>
        <div className="py-10 sm:py-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-content-muted">{items.length} published {items.length === 1 ? "announcement" : "announcements"}</p>
            {canEdit ? <ButtonLink href="/announcements/new">Write announcement</ButtonLink> : null}
          </div>
          {items.length === 0 ? (
            <EmptyState title="No announcements yet" description="News will appear here when the community team publishes it." />
          ) : (
            <div className="grid gap-5">{items.map((item) => <AnnouncementCard key={item.id} announcement={item} />)}</div>
          )}
        </div>
      </Container>
    </>
  );
}
