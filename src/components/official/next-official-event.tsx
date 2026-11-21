import { getNextOfficialEvent } from "@/lib/official/event-queries";
import { NextOfficialEventCard } from "@/components/official/next-official-event-card";

/**
 * The always-visible official event band.
 *
 * Server-rendered from the stored official schedule so the first paint already
 * shows the real event, then the client takes over the countdown. It renders on
 * its own, independent of whether any community member has posted an event.
 */
export async function NextOfficialEvent() {
  const view = await getNextOfficialEvent();
  return <NextOfficialEventCard view={view} />;
}
