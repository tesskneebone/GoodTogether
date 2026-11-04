import * as cheerio from "cheerio";
import { LA_NEIGHBORHOODS } from "@/lib/constants";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { isPathAllowed, BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const LIST_URL =
  "https://www.uclahealth.org/programs/gotblood/make-appointment/community-mobile-blood-drive-calendar";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

const FULL_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function findNeighborhood(text: string): string {
  const lower = text.toLowerCase();
  return LA_NEIGHBORHOODS.find((n) => lower.includes(n.toLowerCase())) ?? "West LA";
}

/**
 * UCLA's Blood & Platelet Center mostly routes to an always-open
 * appointment scheduler (ucedonor.com), which has no discrete dated
 * events to import -- and its robots.txt disallows crawling it anyway.
 * This instead reads UCLA Health's own "Community Mobile Blood Drive
 * Calendar" page, which does list specific dated drives with their own
 * sign-up link into that scheduler. It's hand-edited text (one <p> per
 * drive, fields separated by <br>), not structured data, so parsing is
 * tolerant of formatting drift -- any <p> missing a date, link, or time
 * is just skipped rather than failing the whole import.
 */
export function createUclaBloodAdapter(): ScrapeAdapter {
  return {
    slug: "html:ucla-blood",
    name: "UCLA Blood & Platelet Center",
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
      const now = Date.now();

      $("h2.heading.heading--md").each((_, headingEl) => {
        const headingText = $(headingEl).text().trim();
        const yearMatch = headingText.match(/(\d{4})/);
        if (!yearMatch) return;
        const year = Number(yearMatch[1]);

        const prose = $(headingEl).nextAll("div.prose").first();
        if (prose.length === 0) return;

        prose.find("p").each((_, pEl) => {
          const p = $(pEl);
          const text = p.text().replace(/ /g, " ").replace(/\s+/g, " ").trim();

          const link = p.find("a").first();
          const sourceUrl = link.attr("href")?.trim();
          const title = link.find("strong").first().text().trim() || link.text().trim();

          const dateStrong = p.find("strong").first().text().trim();
          const dateMatch = dateStrong.match(/([A-Za-z]+)\s+(\d{1,2})/);

          const timeMatch = text.match(/(\d{1,2}:\d{2}\s*[ap]m)\s*[-–]\s*(\d{1,2}:\d{2}\s*[ap]m)/i);
          const singleTimeMatch = timeMatch ? null : text.match(/(\d{1,2}:\d{2}\s*[ap]m)/i);
          const startTimeText = timeMatch?.[1] ?? singleTimeMatch?.[1];

          if (!sourceUrl || !title || !dateMatch || !startTimeText) return;

          const month = FULL_MONTHS[dateMatch[1].toLowerCase()];
          const day = Number(dateMatch[2]);
          if (!month) return;

          const start = parse12HourTime(startTimeText);
          if (!start) return;
          const startsAt = laTimeToUtc(year, month, day, start.hour, start.minute);
          if (startsAt.getTime() < now - 6 * 3600_000) return; // skip drives already past

          const end = timeMatch ? parse12HourTime(timeMatch[2]) : null;
          const endsAt = end
            ? laTimeToUtc(year, month, day, end.hour, end.minute)
            : new Date(startsAt.getTime() + 3600_000);

          const codeMatch = text.match(/Code:\s*([A-Za-z0-9]+)/i);
          const locationMatch = text.match(/([A-Za-z .'-]+),\s*CA\s*(\d{5})/);

          const description = codeMatch
            ? `Community blood drive hosted by ${title}. Use booking code ${codeMatch[1]} when you sign up.`
            : `Community blood drive hosted by ${title}.`;

          opportunities.push({
            externalId: sourceUrl,
            title: `Blood Drive: ${title}`,
            description,
            category: "health",
            neighborhood: findNeighborhood(locationMatch ? locationMatch[1] : text),
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
