import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { LA_NEIGHBORHOODS } from "@/lib/constants";
import { guessCategory } from "@/lib/scrape/guess-category";
import { BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const FEED_URL = "https://healthebay.org/events/feed/";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { "#text"?: string };
  pubDate?: string;
  "content:encoded"?: string;
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

function findNeighborhood(text: string): string {
  const lower = text.toLowerCase();
  return LA_NEIGHBORHOODS.find((n) => lower.includes(n.toLowerCase())) ?? "Santa Monica";
}

/**
 * Heal the Bay publishes a WordPress/The Events Calendar RSS feed where
 * <pubDate> is the event's actual start time (not the post date), so it
 * doubles as both the "what's new" feed and the event schedule. The
 * sign-up link lives inside <content:encoded> rather than the item's own
 * <link>, since the public event page sometimes has its link rewritten by
 * an accessibility widget.
 */
export function createHealTheBayAdapter(): ScrapeAdapter {
  return {
    slug: "rss:heal-the-bay",
    name: "Heal the Bay",
    enabled: true,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const res = await fetch(FEED_URL, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`${FEED_URL} responded ${res.status}`);
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
        if (!link || !title || !item.pubDate) continue;

        const startsAt = new Date(item.pubDate);
        if (Number.isNaN(startsAt.getTime())) continue;
        const endsAt = new Date(startsAt.getTime() + 3 * 3600_000);

        const guidValue = typeof item.guid === "string" ? item.guid : item.guid?.["#text"];
        const externalId = (guidValue ?? link).trim();

        const contentHtml = item["content:encoded"] ?? "";
        const description = stripHtml(contentHtml) || title;

        const $ = cheerio.load(contentHtml);
        const signupHref = $("a.button").first().attr("href")?.trim();
        const sourceUrl = signupHref || link;

        opportunities.push({
          externalId,
          title,
          description,
          category: guessCategory(`${title} ${description}`),
          neighborhood: findNeighborhood(`${title} ${description}`),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sourceUrl,
        });
      }

      return opportunities;
    },
  };
}
