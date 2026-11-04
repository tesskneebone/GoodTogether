import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { guessCategory } from "@/lib/scrape/guess-category";
import { BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const FEED_URL = "https://volunteer.mendpoverty.org/need/rss/";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

const MONTH_ABBR: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

interface RssItem {
  title?: string;
  link?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseHappensOn(text: string): { year: number; month: number; day: number } | null {
  const match = text.match(/([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/);
  if (!match) return null;
  const month = MONTH_ABBR[match[1].toLowerCase()];
  if (!month) return null;
  return { year: Number(match[3]), month, day: Number(match[2]) };
}

/**
 * Parses a loose time range like "8am-12pm" or "8:30am - 12:30pm" by
 * pulling out the first two 12-hour time tokens, rather than splitting on
 * "-" (which also appears inside "8am-12pm" with no surrounding spaces).
 */
function parseTimeRange(text: string): { start: { hour: number; minute: number }; end: { hour: number; minute: number } | null } | null {
  const matches = [...text.matchAll(/(\d{1,2}(?::\d{2})?\s*[ap]m)/gi)];
  if (matches.length === 0) return null;
  const start = parse12HourTime(matches[0][0]);
  if (!start) return null;
  const end = matches[1] ? parse12HourTime(matches[1][0]) : null;
  return { start, end };
}

async function fetchNeedDateTime(
  detailUrl: string
): Promise<{ startsAt: Date; endsAt: Date } | null> {
  const res = await fetch(detailUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);

  const rows = $("section.address-time table.info-table tr");
  if (rows.length === 0) return null; // ongoing role, no fixed date

  const dateText = rows.eq(0).find("td.text").first().text().replace(/happens on/i, "").trim();
  const date = parseHappensOn(dateText);
  if (!date) return null;

  const timeText = rows.eq(1).find("td.text").first().text().trim();
  const range = parseTimeRange(timeText);
  const start = range?.start ?? { hour: 8, minute: 0 };

  const startsAt = laTimeToUtc(date.year, date.month, date.day, start.hour, start.minute);
  const endsAt = range?.end
    ? laTimeToUtc(date.year, date.month, date.day, range.end.hour, range.end.minute)
    : new Date(startsAt.getTime() + 3 * 3600_000);

  return { startsAt, endsAt };
}

/**
 * MEND (Meet Each Need with Dignity) runs its own Galaxy Digital
 * volunteer portal, not a marketplace. The RSS feed only carries the
 * posting date, not the shift date, so each need's own detail page has
 * to be fetched to read the real date/time -- done with a short delay
 * between requests since there are a dozen of them.
 */
export function createMendAdapter(): ScrapeAdapter {
  return {
    slug: "rss:mend",
    name: "MEND (Meet Each Need with Dignity)",
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
        const rawTitle = item.title?.trim();
        if (!rawLink || !rawTitle) continue;

        const title = rawTitle.replace(/^'+|'+$/g, "").trim();
        const sourceUrl = rawLink.replace(/^http:/, "https:");

        const dateTime = await fetchNeedDateTime(sourceUrl);
        await sleep(1000);
        if (!dateTime) continue;

        const needId = new URL(sourceUrl).searchParams.get("need_id");
        const externalId = needId ?? sourceUrl;

        const guessed = guessCategory(title);
        const category = guessed === "other" ? "food_security" : guessed;

        opportunities.push({
          externalId,
          title,
          description: title,
          category,
          neighborhood: "San Fernando Valley",
          startsAt: dateTime.startsAt.toISOString(),
          endsAt: dateTime.endsAt.toISOString(),
          sourceUrl,
        });
      }

      return opportunities;
    },
  };
}
