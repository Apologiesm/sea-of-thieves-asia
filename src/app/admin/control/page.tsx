import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { requireOwner } from "@/lib/m8/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings, type SiteSettings } from "@/lib/site/settings";
import { ControlPanel, type DeleteItem } from "@/components/admin/ControlPanel";

export const metadata: Metadata = { title: "Owner control" };

const SOURCES = [
  { table: "announcements", type: "announcement", label: "Announcement" },
  { table: "events", type: "event", label: "Event" },
  { table: "guides", type: "guide", label: "Guide" },
  { table: "gallery_items", type: "gallery_item", label: "Gallery item" },
  { table: "reports", type: "report", label: "Report" },
  { table: "discord_announcements", type: "discord_announcement", label: "Discord announcement" },
];

export default async function ControlPage() {
  const owner = await requireOwner();
  const settings: SiteSettings = await getSiteSettings();
  const items: DeleteItem[] = [];

  if (owner) {
    const admin = createAdminClient();
    if (admin) {
      for (const source of SOURCES) {
        const { data } = await admin.from(source.table).select("id,title").limit(20);
        (data ?? []).forEach((row) => {
          items.push({ id: row.id, title: row.title || `${source.label} ${row.id.slice(0, 8)}`, type: source.type });
        });
      }
    }
  }

  return (
    <>
      <PageHeader eyebrow="Owner control" title="Master control" description="Owner-only switches, Discord feed settings and deletion across the whole site." />
      <Container>
        <div className="py-10 sm:py-14">
          {!owner ? (
            <Card><p className="text-sm text-content-muted">Owner access required.</p></Card>
          ) : (
            <ControlPanel initial={settings} items={items} />
          )}
        </div>
      </Container>
    </>
  );
}
