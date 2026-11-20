import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import type { MemberProfile } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Member profile",
  description: "Your Sea of Thieves Asia member profile.",
};

const visibilityLabels = {
  private: "Only me",
  members: "Signed-in members",
  public: "Everyone",
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <dt className="text-xs uppercase tracking-[0.16em] text-content-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-content">{value}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=not_configured");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as MemberProfile | null;

  return (
    <>
      <PageHeader
        eyebrow="Member area"
        title="Your profile"
        description="This information is yours. Only fields you allow are visible to others."
      />
      <Container>
        <div className="grid gap-8 py-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Card>
              <div className="flex items-center gap-4">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full border border-border bg-surface-raised text-lg font-bold text-content-muted">
                    {(profile?.display_name ?? "P").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-content">
                    {profile?.display_name ?? "Unnamed pirate"}
                  </p>
                  <Badge tone="accent">
                    {visibilityLabels[profile?.visibility ?? "private"]}
                  </Badge>
                </div>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-content-muted">
                Your Discord identity and email are never shown on this page or
                to other members.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <ButtonLink href="/settings">Edit profile and privacy</ButtonLink>
                <Link
                  href="/privacy"
                  className="min-h-11 inline-flex items-center text-sm text-content-muted underline underline-offset-4 hover:text-content"
                >
                  Read the privacy policy
                </Link>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card>
              <dl>
                <Row label="Display name" value={profile?.display_name ?? "Not set"} />
                <Row label="Region" value={profile?.region ?? "Not set"} />
                <Row
                  label="Languages"
                  value={(profile?.languages ?? []).join(", ") || "Not set"}
                />
                <Row label="Platform" value={profile?.platform ?? "Not set"} />
                <Row label="Playstyle" value={profile?.playstyle ?? "Not set"} />
                <Row label="Bio" value={profile?.bio ?? "Not set"} />
                <Row
                  label="Social links"
                  value={
                    Object.entries(profile?.social_links ?? {})
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ") || "Not set"
                  }
                />
                <Row label="Crew name" value={profile?.crew_name ?? "Not set"} />
                <Row label="Crew role" value={profile?.crew_role ?? "Not set"} />
              </dl>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
