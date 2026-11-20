import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/m8/auth";
import { ADMIN_PRIVACY_NOTICE, ROLE_LABELS } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Admin dashboard" };

const SECTIONS = [
  { href: "/admin/guides", title: "Guides", description: "Publish, edit and archive guides." },
  { href: "/admin/announcements", title: "Announcements", description: "Publish and pin community news." },
  { href: "/admin/gallery", title: "Gallery moderation", description: "Approve or reject uploads." },
  { href: "/admin/reports", title: "Reports", description: "Review private moderation reports." },
  { href: "/admin/users", title: "Users and roles", description: "Manage member, moderator, admin and owner roles." },
  { href: "/admin/settings", title: "Settings and audit", description: "Privacy controls and sensitive-action audit log." },
  { href: "/admin/control", title: "Master control", description: "Owner-only feature switches, Discord feed settings and global delete." },
];

export default async function AdminPage() {
  const allowed = Boolean(await requireAdmin());
  return (
    <>
      <PageHeader eyebrow="Administration" title="Admin dashboard" description="Protected area. Every sensitive action is server-authorized and audit-logged." />
      <Container>
        <div className="py-10 sm:py-14">
          {!allowed ? (
            <Card><p className="text-sm text-content-muted">You do not have admin access.</p></Card>
          ) : (
            <>
              <p className="mb-8 text-sm text-content-muted">Roles: {Object.values(ROLE_LABELS).join(" · ")}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SECTIONS.map((section) => (
                  <Link key={section.href} href={section.href} className="rounded-card border border-border bg-surface p-5 hover:border-brand">
                    <h2 className="text-lg font-semibold text-content">{section.title}</h2>
                    <p className="mt-2 text-sm text-content-muted">{section.description}</p>
                  </Link>
                ))}
              </div>
              <p className="mt-10 text-xs leading-relaxed text-content-muted">{ADMIN_PRIVACY_NOTICE}</p>
            </>
          )}
        </div>
      </Container>
    </>
  );
}
