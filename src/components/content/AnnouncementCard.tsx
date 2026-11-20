import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/TiltCard";
import { MarkdownView } from "@/components/content/MarkdownView";
import type { AnnouncementRecord } from "@/lib/m8/types";

export function AnnouncementCard({ announcement }: { announcement: AnnouncementRecord }) {
  return (
    <TiltCard>
      <Card>
      {announcement.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={announcement.cover_image_url} alt={`${announcement.title} cover`} className="announcement-card__cover" loading="lazy" />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-brand">{announcement.category ?? "News"}</p>
          {announcement.pinned ? <Badge tone="accent">Pinned</Badge> : null}
        </div>
        <span className="text-xs text-content-muted">
          {announcement.published_at ? new Date(announcement.published_at).toLocaleDateString() : "Draft"}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-content">{announcement.title}</h3>
      <div className="mt-3 line-clamp-4">
        <MarkdownView content={announcement.body} />
      </div>
      <Link href={`/announcements/${announcement.id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-content underline decoration-border underline-offset-4">
        Read announcement →
      </Link>
      </Card>
    </TiltCard>
  );
}
