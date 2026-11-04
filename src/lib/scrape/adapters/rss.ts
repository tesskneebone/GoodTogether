import { XMLParser } from "fast-xml-parser";
import { LA_NEIGHBORHOODS } from "@/lib/constants";
import { guessCategory } from "@/lib/scrape/guess-category";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

export interface RssAdapterConfig {
  slug: string;
  name: string;
  feedUrl: string;
  enabled?: boolean;
  /** RSS rarely publishes an explicit end time; assume this long if it doesn't. */
  defaultDurationHours?: number;
  /** Falls back to this when the feed text doesn't name one of our LA neighborhoods. */
  defaultNeighborhood?: string;
}

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { "#text"?: string };
  description?: string;
  "content:encoded"?: string;
  pubDate?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function findNeighborhood(text: string, fallback: string): string {
  const lower = text.toLowerCase();
  const hit = LA_NEIGHBORHOODS.find((n) => lower.includes(n.toLowerCase()));
  return hit ?? fallback;
}

/**
 * Generic adapter for any standard RSS 2.0 feed. RSS is explicitly meant
 * for syndication, which is why this is the recommended way to pull in
 * external listings rather than scraping a site's raw HTML -- but it
 * means most feeds won't publish structured event times or categories,
 * so those are inferred/defaulted here.
 */
export function createRssAdapter(config: RssAdapterConfig): ScrapeAdapter {
  const {
    slug,
    name,
    feedUrl,
    enabled = true,
    defaultDurationHours = 3,
    defaultNeighborhood = "Downtown LA",
  } = config;

  return {
    slug,
    name,
    enabled,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const res = await fetch(feedUrl, {
        headers: {
          "User-Agent": "GoodTogetherLA-ImportBot/1.0 (+https://goodtogether.vercel.app)",
        },
      });
      if (!res.ok) {
        throw new Error(`${feedUrl} responded ${res.status}`);
      }
      const xml = await res.text();

      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);
      const items: RssItem[] = parsed?.rss?.channel?.item
        ? [].concat(parsed.rss.channel.item)
        : [];

      const opportunities: ScrapedOpportunity[] = [];

      for (const item of items) {
        const link = item.link?.trim();
        const title = item.title?.trim();
        if (!link || !title) continue;

        const guidValue =
          typeof item.guid === "string" ? item.guid : item.guid?.["#text"];
        const externalId = (guidValue ?? link).trim();

        const rawDescription = item["content:encoded"] ?? item.description ?? "";
        const description = stripHtml(rawDescription) || title;

        const startsAt = item.pubDate ? new Date(item.pubDate) : new Date();
        const endsAt = new Date(startsAt.getTime() + defaultDurationHours * 3600_000);

        opportunities.push({
          externalId,
          title,
          description,
          category: guessCategory(`${title} ${description}`),
          neighborhood: findNeighborhood(`${title} ${description}`, defaultNeighborhood),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sourceUrl: link,
        });
      }

      return opportunities;
    },
  };
}
