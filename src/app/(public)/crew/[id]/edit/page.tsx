import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { CrewForm } from "@/components/crew/CrewForm";
import { getCrewListing } from "@/lib/crew/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit crew listing" };

export default async function EditCrewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect("/login");

  const listing = await getCrewListing(id);
  if (!listing) notFound();
  if (listing.author_id !== user.id) redirect(`/crew/${id}`);

  return (
    <>
      <PageHeader
        eyebrow="Crew finder"
        title="Edit your listing"
        description="Only you can edit this listing. Changes are validated on the server."
      />
      <Container>
        <div className="max-w-4xl py-12">
          <CrewForm listing={listing} />
        </div>
      </Container>
    </>
  );
}
