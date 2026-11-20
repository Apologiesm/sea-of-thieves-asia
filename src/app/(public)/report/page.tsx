import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { ReportGenericForm } from "@/components/content/ReportGenericForm";
import { requireUser } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Report content" };

export default async function ReportPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader eyebrow="Safety" title="Report content" description="Reports are private and reviewed only by authorized moderators." />
      <Container>
        <div className="max-w-2xl py-12">
          {user ? (
            <Card><ReportGenericForm /></Card>
          ) : (
            <Card><p className="text-sm text-content-muted">Sign in to submit a report.</p></Card>
          )}
        </div>
      </Container>
    </>
  );
}
