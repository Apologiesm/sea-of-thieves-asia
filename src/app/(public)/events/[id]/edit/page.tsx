import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EventForm } from "@/components/event/EventForm";
import { getEvent } from "@/lib/event/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect("/login");

  let allowed = false;
  if (supabase) {
    const { data } = await supabase.rpc("is_event_host");
    allowed = Boolean(data);
  }
  if (!allowed && event.created_by !== user.id) redirect(`/events/${id}`);

  return (
    <>
      <PageHeader eyebrow="Events" title="Edit event" description="Changes are validated and authorized on the server." />
      <Container>
        <div className="max-w-4xl py-12"><EventForm event={event} /></div>
      </Container>
    </>
  );
}
