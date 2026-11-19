"use client";

import { Container } from "@/components/ui/container";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: ErrorBoundaryProps) {
  return (
    <Container>
      <div className="py-24 text-center">
        <h1 className="text-3xl font-bold text-content sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-content-muted">
          This page could not be loaded. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-brand-strong"
        >
          Try again
        </button>
      </div>
    </Container>
  );
}
