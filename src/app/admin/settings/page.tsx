import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { AuditLogView } from "@/components/content/AuditLogView";
import { requireAdmin } from "@/lib/m8/auth";
import { ADMIN_PRIVACY_NOTICE } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Admin settings and audit" };

export default async function AdminSettingsPage() {
  const allowed = Boolean(await requireAdmin());
  return (
    <>
      <PageHeader eyebrow="Administration" title="Settings and audit" description="Privacy controls and the sensitive-action audit log." />
      <Container>
        <div className="py-10 sm:py-14">
          {!allowed ? (
            <Card><p className="text-sm text-content-muted">Admin access required.</p></Card>
          ) : (
            <>
              <Card>
                <h2 className="text-base font-semibold text-content">Privacy policy</h2>
                <p className="mt-3 text-sm leading-relaxed text-content-muted">{ADMIN_PRIVACY_NOTICE}</p>
                <p className="mt-3 text-xs text-content-muted">No analytics, advertising cookies, trackers or third-party scripts are installed. Secrets are server-only.</p>
              </Card>
              <div className="mt-8">
                <h2 className="mb-4 text-lg font-semibold text-content">Audit log</h2>
                <AuditLogView />
              </div>
            </>
          )}
        </div>
      </Container>
    </>
  );
}
