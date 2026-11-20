import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { RoleManager } from "@/components/content/RoleManager";
import { requireAdmin } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Users and roles" };

export default async function AdminUsersPage() {
  const allowed = Boolean(await requireAdmin());
  return (
    <>
      <PageHeader eyebrow="Administration" title="Users and roles" description="Role changes are server-authorized and audit-logged. Only an owner can grant the owner role." />
      <Container><div className="py-10 sm:py-14">{allowed ? <RoleManager /> : <Card><p className="text-sm text-content-muted">Admin access required.</p></Card>}</div></Container>
    </>
  );
}
