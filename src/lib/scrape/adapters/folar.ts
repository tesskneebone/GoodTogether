import * as cheerio from "cheerio";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { isPathAllowed, BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const LIST_URL = "https://folar.org/events/";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

const MONTH_ABBR: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Friends of the LA River's own /events/feed/ returns 403, so this reads
 * the events page's HTML directly. Events are grouped under a "Month
 * Year" <h2> (the only place the year appears) inside div.year.row
 * blocks, several of which are empty placeholders with no events.
 */
export function createFolarAdapter(): ScrapeAdapter {
  return {
    slug: "html:folar",
    name: "Friends of the Los Angeles River",
    enabled: true,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const allowed = await isPathAllowed(LIST_URL);
      if (!allowed) {
        throw new Error(`robots.txt disallows ${LIST_URL} -- adapter left disabled`);
      }

      const res = await fetch(LIST_URL, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`${LIST_URL} responded ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const base = new URL(LIST_URL);

      const opportunities: ScrapedOpportunity[] = [];

      $("div.year.row").each((_, row) => {
        const $row = $(row);
        const headerMatch = $row.find("h2").first().text().trim().match(/([A-Za-z]+)\s+(\d{4})/);
        if (!headerMatch) return; // empty placeholder row

        const year = Number(headerMatch[2]);

        $row.find(".event-item").each((_, el) => {
          const item = $(el);
          const titleEl = item.find("h3.event-title a").first();
          const title = titleEl.text().trim();
          const eventHref = titleEl.attr("href");
          if (!title || !eventHref) return;

          const signupHrefRaw = item.find("a.pinkbtn").first().attr("href");
          const sourceUrl = new URL(signupHrefRaw || eventHref, base).toString();

          const monthText = item.find(".date span.month").first().text().trim().toLowerCase();
          const dayText = item.find(".date span.day").first().text().trim();
          const month = MONTH_ABBR[monthText.slice(0, 3)];
          const day = Number(dayText);
          if (!month || !day) return;

          const timeText = item.find("p.text-white.mb-0").first().text().trim();
          const [startText, endText] = timeText.split(/-|–/).map((s) => s.trim());
          const start = parse12HourTime(startText ?? "") ?? { hour: 8, minute: 0 };
          const end = endText ? parse12HourTime(endText) : null;

          const startsAt = laTimeToUtc(year, month, day, start.hour, start.minute);
          const endsAt = end
            ? laTimeToUtc(year, month, day, end.hour, end.minute)
            : new Date(startsAt.getTime() + 3 * 3600_000);

          opportunities.push({
            externalId: new URL(eventHref, base).toString(),
            title,
            description: title,
            category: "environment",
            neighborhood: "Silver Lake",
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            sourceUrl,
          });
        });
      });

      return opportunities;
    },
  };
}
