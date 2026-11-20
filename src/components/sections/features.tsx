import Link from "next/link";
import { Container } from "@/components/ui/container";
import { VoyageArt } from "@/components/content/VoyageArt";
import { FEATURES } from "@/lib/content/site-config";

const LINKS: Record<string, { href: string; label: string }> = {
  crew: { href: "/crew", label: "Open crew finder" },
  events: { href: "/events", label: "See event calendar" },
  guides: { href: "/guides", label: "Browse guides" },
  gallery: { href: "/gallery", label: "Visit gallery" },
};

const TAGS: Record<string, string> = {
  crew: "Calls & replies",
  events: "Fleet nights",
  guides: "Player notes",
  gallery: "Screens & clips",
};

export function CommunityFeatures() {
  return (
    <section aria-labelledby="features-title" className="features-section border-b border-border py-16 sm:py-24">
      <Container>
        <div className="features-heading" data-voyage-reveal>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              What this place is for
            </p>
            <h2 id="features-title" className="mt-5 text-3xl font-bold tracking-tight text-content sm:text-4xl">
              Built around the voyage
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-content-muted">
            Practical corners of the site, made for sailors who would rather be
            sailing than reading a manual.
          </p>
        </div>

        <div className="features-grid" data-voyage-reveal>
          {FEATURES.map((feature, index) => {
            const link = LINKS[feature.key];
            return (
              <article
                key={feature.key}
                className={`voyage-card voyage-card--${feature.key} ${feature.size === "large" ? "voyage-card--wide" : ""}`}
              >
                <div className="voyage-card__top">
                  <span className="voyage-card__index">{String(index + 1).padStart(2, "0")} / 04</span>
                  <span className="voyage-card__tag">{TAGS[feature.key]}</span>
                </div>
                <div className="voyage-card__art">
                  <VoyageArt kind={feature.key} />
                </div>
                <div className="voyage-card__body">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <Link href={link.href} className="voyage-card__link">
                  {link.label} <span aria-hidden="true">→</span>
                </Link>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
