import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <Container>
      <div className="py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-content-muted">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold text-content sm:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-content-muted">
          The page you were looking for does not exist or has not been published
          yet.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/">Return home</ButtonLink>
        </div>
        <p className="mt-6 text-xs text-content-muted">
          <Link href="/" className="underline underline-offset-4">
            Sea of Thieves Asia
          </Link>{" "}
          is an unofficial fan community.
        </p>
      </div>
    </Container>
  );
}
