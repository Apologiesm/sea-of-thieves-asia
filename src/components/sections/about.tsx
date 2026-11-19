import { Container } from "@/components/ui/container";
import { ABOUT } from "@/lib/content/site-config";

export function About() {
  return (
    <section id="community" aria-labelledby="about-title" className="scroll-mt-20 border-b border-border py-16 sm:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5" data-voyage-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              {ABOUT.eyebrow}
            </p>
            <h2
              id="about-title"
              className="mt-5 text-3xl font-bold leading-tight tracking-tight text-content sm:text-4xl lg:text-5xl"
            >
              {ABOUT.title}
            </h2>
            <div className="mt-8 space-y-5">
              {ABOUT.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="max-w-xl text-base leading-relaxed text-content-muted"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7" data-voyage-reveal>
            <div className="relative h-full rounded-card border border-border bg-surface/40 p-6 sm:p-9">
              <div className="pointer-events-none absolute right-4 top-4 h-32 w-32 opacity-30" aria-hidden="true">
                <div className="compass-mark compass-mark--large" />
              </div>
              <ol className="relative grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/60 sm:grid-cols-3">
                {ABOUT.pillars.map((pillar, index) => (
                  <li key={pillar.title} className="bg-surface p-5 sm:p-6">
                    <span className="font-mono text-xs text-brand">
                      0{index + 1}
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-content">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-content-muted">
                      {pillar.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
