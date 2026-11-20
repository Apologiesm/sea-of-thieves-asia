import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { SITE } from "@/lib/content/site-config";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of use" description="Plain-language terms for using this unofficial fan community." />
      <Container>
        <div className="prose-invert mx-auto max-w-3xl space-y-8 py-12 text-sm leading-relaxed text-content-muted">
          <Card>
            <h2 className="text-lg font-semibold text-content">1. Unofficial status</h2>
            <p className="mt-3">{SITE.disclaimer} This site is maintained by fans, not by Rare, Xbox or Microsoft.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">2. Your account</h2>
            <p className="mt-3">Sign in with Discord if you want to post listings, RSVP, upload media or comment. You are responsible for activity under your account and for the content you submit.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">3. Your content</h2>
            <p className="mt-3">You keep ownership of what you post. By posting, you allow this site to display it to other members and to remove it when required for safety or moderation. Do not post content you do not have the right to share.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">4. Acceptable use</h2>
            <p className="mt-3">Follow the <Link href="/conduct" className="underline underline-offset-4">code of conduct</Link>. Harassment, impersonation, spam, and attempts to bypass moderation are not allowed.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">5. Availability and liability</h2>
            <p className="mt-3">This is a beta community project provided as-is. We do not guarantee uninterrupted availability and are not liable for losses arising from use of the site.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-content">6. Changes and deletion</h2>
            <p className="mt-3">You can edit or delete your own data in <Link href="/settings" className="underline underline-offset-4">privacy settings</Link>. See the <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link> and <Link href="/data-request" className="underline underline-offset-4">data request page</Link> for details.</p>
          </Card>
        </div>
      </Container>
    </>
  );
}
