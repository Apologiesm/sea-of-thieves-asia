import { Container } from "@/components/ui/container";
import { JOIN_CTA, SITE } from "@/lib/content/site-config";
import { safeHref } from "@/lib/content/placeholders";

export function JoinCta() {
  const href = safeHref(JOIN_CTA.linkValue);

  return (
    <section aria-labelledby="join-title" className="relative overflow-hidden border-y border-border py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 hero-sky opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 hero-waves" aria-hidden="true" />
      <Container>
        <div className="relative mx-auto max-w-3xl text-center" data-voyage-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {JOIN_CTA.eyebrow}
          </p>
          <h2
            id="join-title"
            className="mt-5 text-3xl font-bold tracking-tight text-content sm:text-4xl lg:text-5xl"
          >
            {JOIN_CTA.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-content-muted sm:text-lg">
            {JOIN_CTA.body}
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-7 py-3 text-sm font-semibold text-canvas hover:bg-brand-strong"
              >
                {JOIN_CTA.buttonLabel}
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-label={`${JOIN_CTA.buttonLabel}: ${SITE.comingSoon}`}
                className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-lg border border-border bg-surface px-7 py-3 text-sm font-semibold text-content-muted opacity-70"
              >
                {JOIN_CTA.buttonLabel} · {SITE.comingSoon}
              </button>
            )}
            <p className="text-xs text-content-muted">{JOIN_CTA.note}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
