import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { VoyageChecklist } from "@/components/content/VoyageChecklist";

export const metadata: Metadata = { title: "Voyage tools", description: "Practical tools for Sea of Thieves sailors." };

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="Voyage tools"
        description="Small, practical helpers that work without accounts, cookies or data collection."
      />
      <Container>
        <div className="grid gap-6 py-12 lg:grid-cols-12">
          <div className="lg:col-span-7"><Card><VoyageChecklist /></Card></div>
          <div className="lg:col-span-5">
            <Card>
              <h2 className="text-lg font-semibold text-content">Other useful places</h2>
              <div className="mt-4 grid gap-3">
                <Link href="/events" className="tool-link">Event calendar and filters <span aria-hidden="true">→</span></Link>
                <Link href="/crew" className="tool-link">Find a crew for your region <span aria-hidden="true">→</span></Link>
                <Link href="/guides" className="tool-link">Player-written guides <span aria-hidden="true">→</span></Link>
                <Link href="/report" className="tool-link">Report a problem privately <span aria-hidden="true">→</span></Link>
              </div>
              <p className="mt-5 text-xs text-content-muted">All tools run locally in your browser or use the site&apos;s own server. No analytics, trackers or ad scripts.</p>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
