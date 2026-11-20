import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { GuideCard } from "@/components/content/GuideCard";
import { listGuides } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";
import { GUIDE_CATEGORIES } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Guides", description: "Community knowledge base." };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function GuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = {
    q: one(params.q),
    category: one(params.category),
    tag: one(params.tag),
    author: one(params.author),
  };
  const guides = await listGuides(filters);
  const canEdit = Boolean(await requireModerator());

  return (
    <>
      <PageHeader eyebrow="Knowledge base" title="Guides" description="Practical guides written by the community, for the community." />
      <Container>
        <div className="py-10 sm:py-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-content-muted">{guides.length} published {guides.length === 1 ? "guide" : "guides"}</p>
            {canEdit ? <ButtonLink href="/guides/new">Write a guide</ButtonLink> : null}
          </div>

          <form method="get" className="grid gap-4 rounded-card border border-border bg-surface/60 p-5 sm:grid-cols-4">
            <label><span className="text-xs uppercase text-content-muted">Search</span><input name="q" defaultValue={filters.q} className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content" /></label>
            <label><span className="text-xs uppercase text-content-muted">Category</span><select name="category" defaultValue={filters.category} className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content"><option value="">All</option>{GUIDE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label><span className="text-xs uppercase text-content-muted">Tag</span><input name="tag" defaultValue={filters.tag} className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content" /></label>
            <label><span className="text-xs uppercase text-content-muted">Author</span><input name="author" defaultValue={filters.author} className="mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content" /></label>
            <button type="submit" className="min-h-11 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-canvas sm:col-span-4">Apply filters</button>
          </form>

          <div className="mt-8">
            {guides.length === 0 ? (
              <EmptyState title="No guides published yet" description="No guides have been published yet. Moderators will add real guides here." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
