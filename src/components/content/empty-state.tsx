import type { EmptyStateProps } from "@/types/content";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description = "Coming soon — nothing has been published yet.",
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/60 text-center",
        compact ? "px-4 py-8" : "px-4 py-14 sm:py-20",
      )}
    >
      <p className="text-base font-semibold text-content">{title}</p>
      <p className="mt-2 max-w-md text-sm text-content-muted">{description}</p>
    </div>
  );
}
