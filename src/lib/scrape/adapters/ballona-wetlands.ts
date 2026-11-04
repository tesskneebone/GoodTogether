import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const FEED_URL = "https://www.ballonafriends.org/calendar?format=rss";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { "#text"?: string };
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

/**
 * Squarespace renders the calendar page client-side and the feed's own
 * <pubDate>/URL date are unreliable (the slug for the Nov 14 cleanup says
 * "11/16"), so the real date has to come from each event's own detail
 * page instead of the feed item.
 */
async function fetchEventDateTime(pageUrl: string): Promise<{ startsAt: Date; endsAt: Date } | null> {
  const res = await fetch(pageUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);

  const dateAttr = $("time.event-date").first().attr("datetime");
  const dateMatch = dateAttr?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;
  const [, y, m, d] = dateMatch;

  const start = parse12HourTime($("time.event-time-12hr-start").first().text()) ?? {
    hour: 9,
    minute: 0,
  };
  const end = parse12HourTime($("time.event-time-12hr-end").first().text());

  const startsAt = laTimeToUtc(Number(y), Number(m), Number(d), start.hour, start.minute);
  const endsAt = end
    ? laTimeToUtc(Number(y), Number(m), Number(d), end.hour, end.minute)
    : new Date(startsAt.getTime() + 3 * 3600_000);

  return { startsAt, endsAt };
}

/**
 * Friends of Ballona Wetlands' RSS feed also carries docent-led tours and
 * birding walks, which don't have a volunteer sign-up -- only items whose
 * title names a restoration/cleanup event, and whose content links to
 * their Constant Contact registration page, are kept.
 */
export function createBallonaWetlandsAdapter(): ScrapeAdapter {
  return {
    slug: "rss:ballona-wetlands",
    name: "Friends of Ballona Wetlands",
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
        if (!link || !title) continue;
        if (!/restoration|clean[\s-]?up/i.test(title)) continue;

        const contentHtml = item["content:encoded"] ?? "";
        const $content = cheerio.load(contentHtml);
        const signupHref = $content('a[href*="lp.constantcontactpages.com/ev/reg/"]')
          .first()
          .attr("href")
          ?.trim();
        if (!signupHref) continue;

        const dateTime = await fetchEventDateTime(link);
        if (!dateTime) continue;

        const guidValue = typeof item.guid === "string" ? item.guid : item.guid?.["#text"];
        const externalId = (guidValue ?? signupHref).trim();
        const description = stripHtml(contentHtml) || title;

        opportunities.push({
          externalId,
          title,
          description,
          category: "environment",
          neighborhood: "Playa del Rey",
          startsAt: dateTime.startsAt.toISOString(),
          endsAt: dateTime.endsAt.toISOString(),
          sourceUrl: signupHref,
        });
      }

      return opportunities;
    },
  };
}
