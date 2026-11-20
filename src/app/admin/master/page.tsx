import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { MasterControl } from "@/components/admin/MasterControl";
import { requireAdmin } from "@/lib/m8/auth";
import { getLayoutConfig } from "@/lib/site/layout";

export const metadata: Metadata = { title: "Master control" };
export const dynamic = "force-dynamic";

export default async function MasterControlPage() {
  const allowed = Boolean(await requireAdmin());
  const layout = await getLayoutConfig();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Master control"
        description="Owner and admin: edit, reassign, pin, hide or delete any content, and control layout and feature switches live."
      />
      <Container>
        <div className="py-10 sm:py-14">
          {allowed ? (
            <MasterControl initialLayout={layout} />
          ) : (
            <Card><p className="text-sm text-content-muted">Admin or owner access required.</p></Card>
          )}
        </div>
      </Container>
    </>
  );
}
