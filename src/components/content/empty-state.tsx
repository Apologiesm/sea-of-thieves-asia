import { SITE } from "@/lib/content/site-config";
import { cn } from "@/lib/utils";
import type { EmptyStateProps } from "@/types/content";

/**
 * Intentional empty state. The ornament is decorative CSS, not an icon from
 * an unofficial asset set. It is hidden from assistive technology.
 */
export function EmptyState({
  title,
  description = "Nothing has been published yet.",
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-border/80 bg-surface/50 text-center",
        compact ? "px-5 py-8" : "px-6 py-12 sm:py-16",
      )}
    >
      <div className="pointer-events-none absolute inset-0 wave-field opacity-40" aria-hidden="true" />
      <div className="relative flex flex-col items-center">
        <span className="compass-mark" aria-hidden="true">
          <span className="compass-mark__inner" />
        </span>
        <span className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand">
          {SITE.comingSoon}
        </span>
        <p className="mt-3 text-base font-semibold text-content sm:text-lg">
          {title}
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-content-muted">
          {description}
        </p>
      </div>
    </div>
  );
}
