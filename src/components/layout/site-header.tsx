import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS, SITE } from "@/lib/content/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/95 backdrop-blur">
      <Container>
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md py-2 text-base font-bold tracking-tight text-content sm:text-lg"
          >
            <span>{SITE.name}</span>
            <Badge>BETA</Badge>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1 lg:gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-content-muted transition-colors hover:bg-surface-raised hover:text-content"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <details className="group relative md:hidden">
            <summary
              className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-border px-4 text-sm font-medium text-content [&::-webkit-details-marker]:hidden"
              aria-label="Open navigation menu"
            >
              Menu
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-card border border-border bg-surface p-2 shadow-lg"
            >
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block min-h-11 rounded-lg px-3 py-2 text-sm text-content-muted hover:bg-surface-raised hover:text-content"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
