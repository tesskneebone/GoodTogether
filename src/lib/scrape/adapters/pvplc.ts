import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const FEED_URL = "https://pvplc.org/events/feed/";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { "#text"?: string };
  "content:encoded"?: string;
  "mec:startDate"?: string;
  "mec:startHour"?: string;
  "mec:endDate"?: string;
  "mec:endHour"?: string;
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

function parseMecDateTime(dateStr: string | undefined, hourStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;
  const time = hourStr ? parse12HourTime(hourStr) : null;
  const [, y, m, d] = dateMatch;
  return laTimeToUtc(Number(y), Number(m), Number(d), time?.hour ?? 9, time?.minute ?? 0);
}

/**
 * PVPLC (Palos Verdes Peninsula Land Conservancy) runs the Modern Events
 * Calendar plugin, whose feed mixes real hands-on volunteer days (which
 * route sign-up through PVPLC's own VolunteerHub account) with guided
 * nature/bird walks that register through a separate Blackbaud form. Only
 * the VolunteerHub-linked items are kept.
 */
export function createPvplcAdapter(): ScrapeAdapter {
  return {
    slug: "rss:pvplc",
    name: "Palos Verdes Peninsula Land Conservancy",
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

        const contentHtml = item["content:encoded"] ?? "";
        const $ = cheerio.load(contentHtml);
        const signupHref = $("a.elementor-button")
          .filter((_, el) => /volunteerhub\.com/i.test($(el).attr("href") ?? ""))
          .first()
          .attr("href")
          ?.trim();
        if (!signupHref) continue; // nature walk / Blackbaud registration -- not a volunteer shift

        const startsAt = parseMecDateTime(item["mec:startDate"], item["mec:startHour"]);
        if (!startsAt) continue;
        const endsAt =
          parseMecDateTime(item["mec:endDate"] ?? item["mec:startDate"], item["mec:endHour"]) ??
          new Date(startsAt.getTime() + 3 * 3600_000);

        const guidValue = typeof item.guid === "string" ? item.guid : item.guid?.["#text"];
        const externalId = (guidValue ?? signupHref).trim();
        const description = stripHtml(contentHtml) || title;

        opportunities.push({
          externalId,
          title,
          description,
          category: "environment",
          neighborhood: "Palos Verdes",
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sourceUrl: signupHref,
        });
      }

      return opportunities;
    },
  };
}
