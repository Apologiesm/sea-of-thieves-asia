import type { PageHeaderProps } from "@/types/content";
import { Badge } from "@/components/ui/badge";

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="border-b border-border bg-surface/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {eyebrow ? <Badge tone="accent">{eyebrow}</Badge> : null}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-content sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-content-muted sm:text-lg">
          {description}
        </p>
        <div className="header-ornament" aria-hidden="true"><span /></div>
      </div>
    </header>
  );
}
