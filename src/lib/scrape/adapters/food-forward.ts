import * as cheerio from "cheerio";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { isPathAllowed, BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const LIST_URL = "https://community.foodforward.org/events";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;
const PAGE_COUNT = 5;

// Food Forward's calendar also lists Ventura County shifts; this is an LA
// volunteer site, so those are filtered out by city name.
const NON_LA_COUNTY_CITIES = ["moorpark", "ojai", "oxnard", "thousand oaks", "camarillo", "simi valley", "ventura"];

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function resolveYear(month: number): number {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  return month < currentMonth ? currentYear + 1 : currentYear;
}

/**
 * Food Forward's calendar page doesn't print a year ("Saturday, November
 * 7 - 9:00am - 11:00am"), so the year is inferred relative to today and
 * rolled over at the December/January boundary.
 */
function parseDateLine(text: string): { startsAt: Date; endsAt: Date } | null {
  const match = text
    .trim()
    .match(/[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})\s*-\s*([\d:apm\s]+)-\s*([\d:apm\s]+)$/i);
  if (!match) return null;

  const month = MONTHS[match[1].toLowerCase()];
  const day = Number(match[2]);
  if (!month || !day) return null;
  const year = resolveYear(month);

  const start = parse12HourTime(match[3]);
  const end = parse12HourTime(match[4]);
  if (!start) return null;

  const startsAt = laTimeToUtc(year, month, day, start.hour, start.minute);
  const endsAt = end
    ? laTimeToUtc(year, month, day, end.hour, end.minute)
    : new Date(startsAt.getTime() + 3 * 3600_000);

  return { startsAt, endsAt };
}

/**
 * Food Forward's calendar lists "Open Events" and, further down under a
 * second heading, "Full Events - Register for Standby" -- only the open
 * ones are worth importing, so items are walked in document order,
 * tracking which <h4> section heading was most recently passed.
 */
export function createFoodForwardAdapter(): ScrapeAdapter {
  return {
    slug: "html:food-forward",
    name: "Food Forward",
    enabled: true,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const allowed = await isPathAllowed(LIST_URL);
      if (!allowed) {
        throw new Error(`robots.txt disallows ${LIST_URL} -- adapter left disabled`);
      }

      const opportunities: ScrapedOpportunity[] = [];

      for (let page = 1; page <= PAGE_COUNT; page += 1) {
        const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) break;
        const html = await res.text();
        const $ = cheerio.load(html);

        let inOpenSection = true;
        $("ul.list-group > *").each((_, el) => {
          const node = $(el);
          if (node.is("h4")) {
            inOpenSection = /open events/i.test(node.text());
            return;
          }
          if (!inOpenSection || !node.is("li.calendar-list-item")) return;

          const titleEl = node.find("h5.media-heading a").first();
          const title = titleEl.text().trim();
          const sourceUrl = titleEl.attr("href")?.trim();
          if (!title || !sourceUrl) return;

          const location = node.find("div.calendar-list-content > div.small").first().text().trim();
          if (NON_LA_COUNTY_CITIES.some((city) => location.toLowerCase().includes(city))) return;

          const dateText = node.find("p.medium").first().text();
          const parsedDate = parseDateLine(dateText);
          if (!parsedDate) return;

          opportunities.push({
            externalId: sourceUrl,
            title,
            description: `${title}${location ? ` -- ${location}` : ""}`,
            category: "food_security",
            neighborhood: location.toLowerCase().includes("hollywood")
              ? "Hollywood"
              : location.toLowerCase().includes("long beach")
                ? "Long Beach"
                : location.toLowerCase().includes("torrance")
                  ? "South Bay"
                  : "Downtown LA",
            startsAt: parsedDate.startsAt.toISOString(),
            endsAt: parsedDate.endsAt.toISOString(),
            sourceUrl,
          });
        });
      }

      return opportunities;
    },
  };
}
