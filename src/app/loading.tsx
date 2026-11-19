import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container>
      <div className="animate-pulse py-16">
        <div className="h-4 w-24 rounded bg-surface-raised" />
        <div className="mt-6 h-10 w-2/3 max-w-xl rounded bg-surface-raised" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded bg-surface-raised" />
        <div className="mt-2 h-4 w-5/6 max-w-xl rounded bg-surface-raised" />
        <div className="mt-10 h-40 rounded-card border border-border bg-surface" />
      </div>
    </Container>
  );
}
