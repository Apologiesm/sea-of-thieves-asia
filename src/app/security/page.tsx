import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { PLACEHOLDER, SECURITY_CONTACT_EMAIL } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  const configured = SECURITY_CONTACT_EMAIL !== PLACEHOLDER;
  return (
    <>
      <PageHeader eyebrow="Safety" title="Security" description="How to report a vulnerability privately." />
      <Container>
        <div className="mx-auto max-w-3xl space-y-6 py-12 text-sm leading-relaxed text-content-muted">
          <Card>
            <h2 className="text-lg font-semibold text-content">Reporting a vulnerability</h2>
            <p className="mt-3">Please do not open a public issue for a security problem. Send a private report with the affected URL, a description, reproduction steps and the potential impact. Do not test against other members&apos; accounts or data.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">Security contact</h2>
            {configured ? (
              <a href={`mailto:${SECURITY_CONTACT_EMAIL}`} className="mt-3 inline-block text-content underline underline-offset-4">{SECURITY_CONTACT_EMAIL}</a>
            ) : (
              <p className="mt-3" aria-label={`Security contact: ${PLACEHOLDER}`}>Security contact: {PLACEHOLDER}</p>
            )}
            <p className="mt-3">The address is intentionally shown as a placeholder until the site owner provides one. No fake contact route is published.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">Current controls</h2>
            <p className="mt-3">Row Level Security on every table, server-side role checks, audit logging for sensitive actions, Zod input validation, rate limits, safe markdown rendering, validated file uploads and strict security headers.</p>
          </Card>
        </div>
      </Container>
    </>
  );
}
