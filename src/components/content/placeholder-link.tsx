import { SITE } from "@/lib/content/site-config";
import { safeHref } from "@/lib/content/placeholders";

type PlaceholderLinkProps = {
  label: string;
  value: string;
};

/**
 * Renders a real anchor only when a real URL has been supplied by the owner.
 * Placeholder values become non-clickable text, so no fake link is clickable.
 */
export function PlaceholderLink({ label, value }: PlaceholderLinkProps) {
  const href = safeHref(value);

  return (
    <div className="rounded-card border border-border bg-surface p-4 transition-colors hover:border-brand/60 sm:p-5">
      <p className="text-sm font-semibold text-content">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm text-content-muted underline underline-offset-4 hover:text-content"
        >
          {value}
        </a>
      ) : (
        <p
          className="mt-1 text-sm text-content-muted"
          aria-label={`${label}: ${SITE.comingSoon}`}
        >
          {SITE.comingSoon}
        </p>
      )}
    </div>
  );
}
