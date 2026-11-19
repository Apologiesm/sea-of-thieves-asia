import Link from "next/link";
import { Container } from "@/components/ui/container";
import { FOOTER, SITE } from "@/lib/content/site-config";
import { safeHref } from "@/lib/content/placeholders";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="text-base font-bold text-content">{SITE.name}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-content-muted">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 h-px w-16 bg-brand" aria-hidden="true" />
          </div>

          {FOOTER.columns.map((column) => (
            <div key={column.title} className="lg:col-span-2 lg:col-start-auto">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-content">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {column.items.map((item) => {
                  const href = safeHref(item.value);
                  return (
                    <li key={item.label}>
                      {href && !item.value.startsWith("/") ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-content-muted hover:text-content"
                        >
                          {item.label}
                        </a>
                      ) : href ? (
                        <Link
                          href={href}
                          className="text-sm text-content-muted hover:text-content"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          className="text-sm text-content-muted"
                          aria-label={`${item.label}: ${SITE.comingSoon}`}
                        >
                          {item.label} · {SITE.comingSoon}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border py-7">
          <p className="max-w-4xl text-xs leading-relaxed text-content-muted">
            {SITE.disclaimer}
          </p>
          <p className="mt-4 text-xs text-content-muted">
            © {new Date().getFullYear()} {SITE.name}. Unofficial fan project.
          </p>
        </div>
      </Container>
    </footer>
  );
}
