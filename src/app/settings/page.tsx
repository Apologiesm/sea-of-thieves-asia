import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { toEditableProfile, type MemberProfile } from "@/lib/profile";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";

export const metadata: Metadata = {
  title: "Privacy and profile settings",
  description: "Control your Sea of Thieves Asia profile visibility and data.",
};

export default async function SettingsPage() {
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

  const initial = data
    ? toEditableProfile(data as MemberProfile)
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Private"
        title="Profile and privacy settings"
        description="Choose exactly what other members can see. Nothing here is public until you set it to public."
      />
      <Container>
        <div className="py-12">
          <ProfileSettingsForm initial={initial} />
          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-content-muted">
            We collect only the profile information you choose to provide, plus
            your Discord user ID and avatar URL for sign-in. We do not read
            Discord messages, servers, or connections. See the{" "}
            <a href="/privacy" className="underline underline-offset-4">
              privacy policy
            </a>{" "}
            for retention and deletion details.
          </p>
        </div>
      </Container>
    </>
  );
}
