import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
