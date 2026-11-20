import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Code of conduct" };

export default function ConductPage() {
  return (
    <>
      <PageHeader eyebrow="Community" title="Code of conduct" description="How we keep Sea of Thieves Asia welcoming for players across the region." />
      <Container>
        <div className="mx-auto max-w-3xl space-y-6 py-12 text-sm leading-relaxed text-content-muted">
          <Card>
            <h2 className="text-lg font-semibold text-content">Expected behaviour</h2>
            <p className="mt-3">Be respectful across time zones, languages and playstyles. Assume good faith. Help new captains learn the ropes. Keep content relevant to the community.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">Not acceptable</h2>
            <p className="mt-3">Harassment, hate speech, discrimination, threats, doxxing, impersonation, spam, scams, cheating promotion, and posting content you do not have the right to share.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">Moderation</h2>
            <p className="mt-3">Moderators may hide or remove content and restrict accounts. Sensitive actions are server-side authorized and written to an audit log. Private reports are visible only to authorized moderators.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">Reporting</h2>
            <p className="mt-3">Use the <Link href="/report" className="underline underline-offset-4">report page</Link> or the report control on an item. Do not retaliate against someone for reporting.</p>
          </Card>
        </div>
      </Container>
    </>
  );
}
