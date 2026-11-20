import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EventForm } from "@/components/event/EventForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create event" };

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect("/login?next=/events/new");

  let allowed = false;
  if (supabase) {
    const { data } = await supabase.rpc("is_event_host");
    allowed = Boolean(data);
  }
  if (!allowed) redirect("/events");

  return (
    <>
      <PageHeader eyebrow="Events" title="Create an event" description="Only authorized hosts, moderators and admins can publish events." />
      <Container>
        <div className="max-w-4xl py-12"><EventForm /></div>
      </Container>
    </>
  );
}
