import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { PLACEHOLDER, SECURITY_CONTACT_EMAIL } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Data request" };

export default function DataRequestPage() {
  const configured = SECURITY_CONTACT_EMAIL !== PLACEHOLDER;
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Data deletion request" description="How to remove your data from Sea of Thieves Asia." />
      <Container>
        <div className="mx-auto max-w-3xl space-y-6 py-12 text-sm leading-relaxed text-content-muted">
          <Card>
            <h2 className="text-lg font-semibold text-content">Immediate self-service deletion</h2>
            <p className="mt-3">Sign in and open <Link href="/settings" className="underline underline-offset-4">privacy settings</Link>. Type DELETE to permanently remove your profile, listings, RSVPs, comments and gallery items, and sign out. This is the fastest route.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">What happens to your data</h2>
            <p className="mt-3">Profile data and user-generated content are deleted. A minimal audit record of the deletion action is retained without personal details. Uploaded media is removed from storage. Authentication records are removed through the server-only admin API.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">Need help?</h2>
            {configured ? (
              <a href={`mailto:${SECURITY_CONTACT_EMAIL}`} className="mt-3 inline-block text-content underline underline-offset-4">{SECURITY_CONTACT_EMAIL}</a>
            ) : (
              <p className="mt-3">Contact: {PLACEHOLDER}</p>
            )}
            <p className="mt-3">Do not include passwords or service-role keys in any request.</p>
          </Card>
        </div>
      </Container>
    </>
  );
}
