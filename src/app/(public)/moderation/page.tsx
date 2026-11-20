import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { ModerationQueue } from "@/components/crew/ModerationQueue";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Moderation queue" };

export default async function ModerationPage() {
  const supabase = await createClient();
  let allowed = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc("is_moderator");
      allowed = Boolean(data);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Moderation"
        title="Crew listing reports"
        description="Reports are reviewed by authorized moderators only."
      />
      <Container>
        <div className="max-w-4xl py-12">
          {allowed ? (
            <ModerationQueue />
          ) : (
            <Card>
              <p className="text-sm text-content-muted">
                You do not have moderator access. If you believe this is an error, sign in with the
                account that holds the moderator role.
              </p>
            </Card>
          )}
        </div>
      </Container>
    </>
  );
}
