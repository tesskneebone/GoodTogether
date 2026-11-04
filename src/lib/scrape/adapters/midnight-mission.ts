import * as cheerio from "cheerio";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { isPathAllowed, BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const LIST_URL = "https://midnightmission.galaxydigital.com/need/";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

// The calendar renders the whole current month -- dozens of shifts a day
// across many recurring needs. Capped to the next two weeks so one source
// doesn't dominate the import's volume (and runtime).
const HORIZON_MS = 14 * 24 * 3600_000;

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseDisplayDate(text: string): { year: number; month: number; day: number } | null {
  const match = text.trim().match(/[A-Za-z]+\s+([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  return { year: Number(match[3]), month, day: Number(match[2]) };
}

/**
 * The Midnight Mission's Galaxy Digital "Get Connected" portal renders a
 * server-side month calendar -- each day is a ul.calendar-content whose
 * data-display_date attribute carries the date, holding that day's
 * li.calendar-entry shifts. Recurring shifts reuse the same need_id on
 * multiple days, so the externalId combines need_id with the date.
 */
export function createMidnightMissionAdapter(): ScrapeAdapter {
  return {
    slug: "html:midnight-mission",
    name: "The Midnight Mission",
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

      const opportunities: ScrapedOpportunity[] = [];
      const horizon = Date.now() + HORIZON_MS;

      $("ul.calendar-content").each((_, dayEl) => {
        const $day = $(dayEl);
        const date = parseDisplayDate($day.attr("data-display_date") ?? "");
        if (!date) return;

        $day.find("li.calendar-entry").each((_, entryEl) => {
          const entry = $(entryEl);
          const title = entry.find(".calendar-entry-details-title h4").first().text().trim();
          const hrefRaw = entry.find(".calendar-entry-title a").first().attr("href");
          if (!title || !hrefRaw) return;

          const sourceUrl = new URL(hrefRaw, LIST_URL).toString();
          const needId = new URL(sourceUrl).searchParams.get("need_id") ?? sourceUrl;

          const timeEl = entry.find("span.calendar-entry-date").first().clone();
          timeEl.find("span").remove(); // strips the nested "PT" label
          const [startRaw, endRaw] = timeEl.text().trim().split("-").map((s) => s.trim());
          const start = parse12HourTime(startRaw ?? "") ?? { hour: 9, minute: 0 };
          const end = endRaw ? parse12HourTime(endRaw) : null;

          const startsAt = laTimeToUtc(date.year, date.month, date.day, start.hour, start.minute);
          if (startsAt.getTime() > horizon || startsAt.getTime() < Date.now() - 3600_000) return;
          const endsAt = end
            ? laTimeToUtc(date.year, date.month, date.day, end.hour, end.minute)
            : new Date(startsAt.getTime() + 3 * 3600_000);

          opportunities.push({
            externalId: `${needId}:${date.year}-${date.month}-${date.day}`,
            title,
            description: title,
            category: "homelessness",
            neighborhood: "Downtown LA",
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
