import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsModeration } from "@/components/content/ReportsModeration";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Report queue" };

export default async function AdminReportsPage() {
  const allowed = Boolean(await requireModerator());
  return (
    <>
      <PageHeader eyebrow="Administration" title="Report queue" description="Private reports across profiles, listings, events, comments and media." />
      <Container><div className="py-10 sm:py-14">{allowed ? <ReportsModeration /> : <Card><p className="text-sm text-content-muted">Moderator access required.</p></Card>}</div></Container>
    </>
  );
}
