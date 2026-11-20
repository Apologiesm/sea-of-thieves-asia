import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { VideoLayer } from "@/components/visuals/VideoLayer";
import { HERO } from "@/lib/content/site-config";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="hero-section relative min-h-[88vh] overflow-hidden border-b border-border"
    >
      <VideoLayer src="/media/sot1-hero.mp4" poster="/media/sot1-hero.jpg" variant="hero" />
      <div className="hero-scrim" aria-hidden="true" />

      <Container>
        <div className="relative z-10 py-20 sm:py-28 lg:py-36" data-voyage-hero>
          <div className="max-w-3xl" data-voyage-reveal>
            <Badge tone="accent">{HERO.eyebrow}</Badge>
            <h1
              id="hero-title"
              className="mt-7 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-content sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {HERO.title}
            </h1>
            <p className="mt-5 text-xl font-medium text-brand sm:text-2xl">
              {HERO.subtitle}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-content-muted sm:text-lg">
              {HERO.body}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={HERO.primaryCta.href}>
                {HERO.primaryCta.label}
              </ButtonLink>
              <ButtonLink href={HERO.secondaryCta.href} variant="secondary">
                {HERO.secondaryCta.label}
              </ButtonLink>
            </div>
            <p className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-content-muted">
              <span className="h-px w-8 bg-brand" aria-hidden="true" />
              {HERO.status}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
