import { Container } from "@/components/ui/container";
import { TiltCard } from "@/components/ui/TiltCard";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings, type DiscordChannel } from "@/lib/site/settings";

type Embed = {
  title?: string | null;
  description?: string | null;
  image?: { url: string } | null;
  author?: { name: string } | null;
  footer?: { text: string } | null;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

type DiscordAnnouncement = {
  external_id: string;
  channel_id: string;
  author_name: string | null;
  content: string | null;
  posted_at: string | null;
  image_url: string | null;
  embeds: Embed[];
  message_url: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "Recent";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Singapore",
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function channelIdFrom(channel: DiscordChannel): string {
  if (channel.id.trim()) return channel.id.trim();
  return channel.url.match(/\/channels\/\d+\/(\d+)/)?.[1] ?? "";
}

function AnnouncementItem({ item }: { item: DiscordAnnouncement }) {
  return (
    <article className="discord-card">
      <div className="discord-card__meta">
        <span>{item.author_name ?? "Community team"}</span>
        <time>{formatDate(item.posted_at)}</time>
      </div>
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={`${item.author_name ?? "Discord"} announcement image`} loading="lazy" />
      ) : null}
      {item.content ? <p className="discord-card__content">{item.content}</p> : null}
      {item.embeds.map((embed, index) => (
        <div key={index} className="discord-embed">
          {embed.author ? <span className="discord-embed__author">{embed.author.name}</span> : null}
          {embed.title ? <h3>{embed.title}</h3> : null}
          {embed.description ? <p>{embed.description}</p> : null}
          {embed.fields?.length ? (
            <div className="discord-embed__fields">
              {embed.fields.map((field, fieldIndex) => (
                <div key={fieldIndex}>
                  <strong>{field.name}</strong>
                  <span>{field.value}</span>
                </div>
              ))}
            </div>
          ) : null}
          {embed.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={embed.image.url} alt={embed.title ?? "Discord embed image"} loading="lazy" />
          ) : null}
          {embed.footer ? <small>{embed.footer.text}</small> : null}
        </div>
      ))}
      {item.message_url ? (
        <a href={item.message_url} target="_blank" rel="noopener noreferrer" className="partner-card__link">Open in Discord ↗</a>
      ) : null}
    </article>
  );
}

export async function DiscordAnnouncements() {
  const settings = await getSiteSettings();
  if (!settings.discord.enabled) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const feeds = await Promise.all(settings.discord.channels.map(async (channel) => {
    const id = channelIdFrom(channel);
    let query = supabase
      .from("discord_announcements")
      .select("*")
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(channel.limit || 4);
    if (id) query = query.eq("channel_id", id);
    const { data } = await query;
    return { channel, items: (data ?? []) as DiscordAnnouncement[] };
  }));

  const hasItems = feeds.some((feed) => feed.items.length > 0);

  return (
    <section aria-labelledby="discord-announcements-title" className="official-section">
      <Container>
        <div className="partner-heading">
          <div>
            <p className="partner-eyebrow">From Discord</p>
            <h2 id="discord-announcements-title" className="mt-2 text-2xl font-semibold text-content sm:text-3xl">
              Announcements from the community server
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-muted">
              Discord messages and embeds are rendered natively here with their images and fields. Nothing is embedded from a third-party site.
            </p>
          </div>
        </div>

        {!hasItems ? (
          <p className="partner-empty">No Discord announcements have been synced yet.</p>
        ) : (
          feeds.map(({ channel, items }) => (
            <div key={channel.key} className="discord-feed">
              <h3 className="discord-feed__title">{channel.label}</h3>
              {items.length === 0 ? (
                <p className="partner-empty">No posts in this channel yet.</p>
              ) : (
                <div className="discord-grid">
                  {items.map((item) => (
                    <TiltCard key={item.external_id}>
                      <AnnouncementItem item={item} />
                    </TiltCard>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </Container>
    </section>
  );
}
