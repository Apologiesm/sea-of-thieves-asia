import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data Sea of Thieves Asia collects and how you control it.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="Privacy policy"
        description="This unofficial fan community collects the minimum data needed to let members create a profile."
      />
      <Container>
        <div className="prose-invert mx-auto max-w-3xl space-y-10 py-12 text-sm leading-relaxed text-content-muted">
          <section>
            <h2 className="text-xl font-semibold text-content">What we collect</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>Your Discord user ID, used only to identify your account.</li>
              <li>Your Discord username and avatar URL, used to start your profile.</li>
              <li>Profile fields you choose to fill in: display name, region, languages, platform, playstyle, bio, optional social links, and optional crew information.</li>
              <li>Your visibility choice and a record of account deletion.</li>
            </ul>
            <p className="mt-4">
              We do not request Discord message contents, server or guild lists,
              connections, or friend lists. We never store your Discord email in
              application tables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content">Why we collect it</h2>
            <p className="mt-4">
              Identity data lets you sign in. Profile data lets other members
              find you if you choose to be visible. Nothing is used for
              advertising, profiling, or sale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content">Cookies and tracking</h2>
            <p className="mt-4">
              We do not use analytics, advertising cookies, trackers, or
              third-party scripts. The only cookies set are the essential,
              httpOnly, SameSite cookies required by Supabase Auth to keep you
              signed in. We do not use browser local storage for personal data.
              Blocking these cookies prevents sign-in but does not affect
              public pages.
            </p>
            <p className="mt-4">
              Service providers are limited to Supabase (authentication and
              database), Discord (sign-in only, if you choose to sign in), and
              the site host. No data is sold or shared for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content">Visibility</h2>
            <p className="mt-4">
              Profiles are private by default. You may set your profile to
              &ldquo;signed-in members&rdquo; or &ldquo;everyone&rdquo;. The
              public profile view is a filtered projection that never exposes
              your Discord ID, email, or private fields.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content">Retention</h2>
            <p className="mt-4">
              Profile data is kept until you edit or delete it. Deleting your
              account removes your profile and related rows immediately. An
              audit record of the deletion action is retained without personal
              details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content">Your rights</h2>
            <p className="mt-4">
              You can view, correct, or delete your data at any time in{" "}
              <a href="/settings" className="underline underline-offset-4">
                privacy settings
              </a>
              . To request complete account deletion, use the deletion control
              there. You may also contact the site owner through the contact
              channel listed on the site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content">Crew finder listings</h2>
            <p className="mt-4">
              Crew listings are public. They show the profile fields you chose to make
              visible and the listing details you entered. Your Discord identity,
              email, and private contact details are never public. Contact details
              appear on a listing only if you explicitly consent when creating or
              editing it. Only you can edit or delete your listing; moderators can
              hide or remove listings through authorized server-side actions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-content">Unofficial status</h2>
            <p className="mt-4">
              This is an unofficial fan community. It is not affiliated with,
              endorsed by, or connected to Rare, Xbox, or Sea of Thieves.
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
