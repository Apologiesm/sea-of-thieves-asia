import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { CrewForm } from "@/components/crew/CrewForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create a crew listing" };

export default async function NewCrewPage() {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect("/login?next=/crew/new");

  return (
    <>
      <PageHeader
        eyebrow="Crew finder"
        title="Create a crew listing"
        description="Describe the voyage you want to sail. All fields are plain text."
      />
      <Container>
        <div className="max-w-4xl py-12">
          <CrewForm />
        </div>
      </Container>
    </>
  );
}
