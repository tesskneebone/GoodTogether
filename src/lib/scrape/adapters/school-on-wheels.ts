import { XMLParser } from "fast-xml-parser";
import { LA_NEIGHBORHOODS } from "@/lib/constants";
import { BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const FEED_URL = "https://schoolonwheels.org/events/feed/";
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
  return LA_NEIGHBORHOODS.find((n) => lower.includes(n.toLowerCase())) ?? "Koreatown";
}

/**
 * School on Wheels runs the same WordPress + The Events Calendar setup as
 * Heal the Bay, where <pubDate> is already the event's real start time.
 * These listings are tutor-training/orientation sessions rather than
 * tutoring sessions themselves -- the actual tutoring gets scheduled
 * afterwards -- so that's called out in the description.
 */
export function createSchoolOnWheelsAdapter(): ScrapeAdapter {
  return {
    slug: "rss:school-on-wheels",
    name: "School on Wheels",
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
        const rawLink = item.link?.trim();
        const title = item.title?.trim();
        if (!rawLink || !title || !item.pubDate) continue;

        const startsAt = new Date(item.pubDate);
        if (Number.isNaN(startsAt.getTime())) continue;
        const endsAt = new Date(startsAt.getTime() + 2 * 3600_000);

        const sourceUrl = (() => {
          const url = new URL(rawLink);
          url.search = "";
          return url.toString();
        })();

        const guidValue = typeof item.guid === "string" ? item.guid : item.guid?.["#text"];
        const externalId = (guidValue ?? sourceUrl).trim();

        const contentHtml = item["content:encoded"] ?? "";
        const description =
          `${stripHtml(contentHtml) || title} New tutors complete this training ` +
          "and an orientation before being matched with a student for ongoing tutoring.";

        opportunities.push({
          externalId,
          title,
          description,
          category: "education",
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
