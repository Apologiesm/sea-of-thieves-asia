import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "accent";
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tone === "accent"
          ? "border-brand/40 bg-brand/15 text-content"
          : "border-border bg-surface-raised text-content-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
