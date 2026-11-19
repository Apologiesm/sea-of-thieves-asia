import { Container } from "@/components/ui/container";
import { NAV_LINKS, SITE } from "@/lib/content/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <Container>
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-base font-bold text-content">{SITE.name}</p>
            <p className="mt-3 max-w-sm text-sm text-content-muted">
              {SITE.description}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-content">Explore</p>
            <ul className="mt-3 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-content-muted hover:text-content"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-content">Community</p>
            <p className="mt-3 text-sm text-content-muted">{SITE.comingSoon}</p>
          </div>
        </div>
        <div className="border-t border-border py-6">
          <p className="text-xs leading-relaxed text-content-muted">
            {SITE.disclaimer}
          </p>
        </div>
      </Container>
    </footer>
  );
}
