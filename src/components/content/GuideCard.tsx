import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { GuideRecord } from "@/lib/m8/types";

export function GuideCard({ guide }: { guide: GuideRecord }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-brand">{guide.category ?? "Guide"}</p>
        <Badge tone="accent">{guide.status}</Badge>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-content">{guide.title}</h3>
      {guide.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={guide.image_url} alt={`${guide.title} cover`} className="media-card-cover mt-3" loading="lazy" />
      ) : null}
      {guide.excerpt ? <p className="mt-2 line-clamp-3 text-sm text-content-muted">{guide.excerpt}</p> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {(guide.tags ?? []).map((tag) => (
          <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-content-muted">{tag}</span>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 text-xs text-content-muted">
        <span>{guide.author_name ?? "Community member"} · {guide.reading_minutes} min read</span>
        <span>{new Date(guide.updated_at).toLocaleDateString()}</span>
      </div>
      <Link href={`/guides/${guide.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-content underline decoration-border underline-offset-4">
        Read guide →
      </Link>
    </Card>
  );
}
