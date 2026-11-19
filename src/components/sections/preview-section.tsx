import Link from "next/link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/content/empty-state";
import { SECTIONS, type PreviewConfig } from "@/lib/content/site-config";
import { cn } from "@/lib/utils";

export function PreviewSection({ preview, index }: { preview: PreviewConfig; index: number }) {
  const href = SECTIONS.find((section) => section.key === preview.key)?.href ?? "#";

  return (
    <section
      aria-labelledby={`preview-${preview.key}`}
      className={cn("border-b border-border py-14 sm:py-20", index % 2 === 1 && "bg-surface/20")}
    >
      <Container>
        <div
          className={cn(
            "grid items-center gap-10 lg:grid-cols-12 lg:gap-16",
            preview.reverse && "lg:[&>*:first-child]:order-2",
          )}
        >
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-10 bg-border" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                {preview.eyebrow}
              </span>
            </div>
            <h2
              id={`preview-${preview.key}`}
              className="mt-6 text-2xl font-bold leading-tight tracking-tight text-content sm:text-3xl lg:text-4xl"
            >
              {preview.title}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-content-muted">
              {preview.description}
            </p>
            <Link
              href={href}
              className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-content underline decoration-border underline-offset-8 hover:decoration-brand"
            >
              Open {preview.eyebrow}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="lg:col-span-7">
            <EmptyState
              title={preview.emptyTitle}
              description={preview.emptyDescription}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
