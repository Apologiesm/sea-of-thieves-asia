import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { FEATURES } from "@/lib/content/site-config";
import { cn } from "@/lib/utils";

export function CommunityFeatures() {
  return (
    <section aria-labelledby="features-title" className="border-b border-border py-16 sm:py-24">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl" data-voyage-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              What this place is for
            </p>
            <h2
              id="features-title"
              className="mt-5 text-3xl font-bold tracking-tight text-content sm:text-4xl"
            >
              Built around the voyage
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-content-muted">
            Every feature exists to help real players find each other and share
            the seas. None of it is populated until the community does.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" data-voyage-reveal>
          {FEATURES.map((feature, index) => (
            <Card
              key={feature.key}
              className={cn(
                "group relative flex min-h-56 flex-col justify-between overflow-hidden",
                feature.size === "large" && "sm:col-span-2 lg:min-h-64",
              )}
            >
              <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border border-border/60" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full border border-border/40" aria-hidden="true" />
              <div className="relative">
                <span className="font-mono text-xs text-brand">
                  0{index + 1} / 0{FEATURES.length}
                </span>
                <h3 className="mt-6 text-xl font-semibold text-content sm:text-2xl">
                  {feature.title}
                </h3>
              </div>
              <p className="relative mt-6 max-w-md text-sm leading-relaxed text-content-muted">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
