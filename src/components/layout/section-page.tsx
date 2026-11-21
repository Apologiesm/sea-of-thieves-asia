import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/content/empty-state";
import { PageHeader } from "@/components/layout/page-header";

type SectionPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function SectionPage({
  title,
  description,
  eyebrow = "COMMUNITY",
  emptyTitle,
  emptyDescription,
}: SectionPageProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Container>
        <div className="py-12 sm:py-16">
          <EmptyState
            title={emptyTitle ?? title}
            description={emptyDescription ?? "Nothing has been published yet."}
          />
        </div>
      </Container>
    </>
  );
}
