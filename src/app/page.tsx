import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/content/empty-state";
import { PlaceholderLink } from "@/components/content/placeholder-link";
import { SECTIONS, SITE, SOCIAL_LINKS } from "@/lib/content/site-config";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-surface/70 to-canvas">
        <Container>
          <div className="py-16 sm:py-24 lg:py-32">
            <Badge tone="accent">BETA — BUILD IN PROGRESS</Badge>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-content sm:text-5xl lg:text-6xl">
              {SITE.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-content-muted sm:text-xl">
              {SITE.description}
            </p>
            <p className="mt-4 max-w-2xl text-sm text-content-muted">
              This site is in beta. Community links and content are being
              prepared and will be published here when available.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#community">Explore the community</ButtonLink>
              <ButtonLink href="#sections" variant="secondary">
                See what is coming
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section id="community" className="scroll-mt-20 py-14 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Community
            </h2>
            <p className="mt-3 text-base text-content-muted">
              Where the community will gather. Unavailable links are marked{" "}
              {SITE.comingSoon}.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOCIAL_LINKS.map((link) => (
              <PlaceholderLink
                key={link.key}
                label={link.label}
                value={link.value}
              />
            ))}
          </div>
        </Container>
      </section>

      <section id="sections" className="scroll-mt-20 border-y border-border bg-surface/30 py-14 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              What is coming
            </h2>
            <p className="mt-3 text-base text-content-muted">
              Each area is being built. No content is published yet.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((section) => (
              <Card key={section.key} className="flex h-full flex-col">
                <h3 className="text-lg font-semibold text-content">
                  {section.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-content-muted">
                  {section.description}
                </p>
                <div className="mt-5">
                  <EmptyState
                    title={`${section.title}: ${SITE.comingSoon}`}
                    compact
                  />
                </div>
                <Link
                  href={section.href}
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-content hover:underline"
                >
                  Visit {section.title}
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Built for the community, not published as one yet
            </h2>
            <p className="mt-4 text-base text-content-muted">
              We are building the platform first. Events, guides, gallery
              entries, announcements, and crew listings will appear only when
              real community members provide them.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
