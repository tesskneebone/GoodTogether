import * as cheerio from "cheerio";
import { laTimeToUtc, parse12HourTime } from "@/lib/scrape/la-time";
import { isPathAllowed, BOT_USER_AGENT } from "@/lib/scrape/robots";
import { mapWithConcurrency } from "@/lib/scrape/concurrency";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const LIST_URL =
  "https://www.cervistech.com/acts/webreg/eventwebreglist.php?org_id=0267&console_mode=console";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

// Childcare shifts are ongoing service (any registered adult, any time),
// not dated single events like the meal-service shifts -- skip them.
const SKIP_EVENT_IDS = new Set(["1668", "2615"]);

// Bounds how many upcoming slots are pulled per recurring program, so one
// program's months of daily shifts don't flood the feed or blow the
// import's time budget.
const MAX_SLOTS_PER_PROGRAM = 3;

const MONTH_ABBR: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function parseSlotDateTime(
  text: string
): { year: number; month: number; day: number; start: { hour: number; minute: number }; end: { hour: number; minute: number } | null } | null {
  const cleaned = text.replace(/ /g, " ").replace(/\s+/g, " ").trim();
  const dateMatch = cleaned.match(/([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/);
  if (!dateMatch) return null;
  const month = MONTH_ABBR[dateMatch[1].toLowerCase()];
  if (!month) return null;

  const times = [...cleaned.matchAll(/(\d{1,2}(?::\d{2})?\s*[AP]M)/gi)];
  if (times.length === 0) return null;
  const start = parse12HourTime(times[0][0]);
  if (!start) return null;
  const end = times[1] ? parse12HourTime(times[1][0]) : null;

  return { year: Number(dateMatch[3]), month, day: Number(dateMatch[2]), start, end };
}

async function fetchProgramSlots(detailUrl: string, title: string): Promise<ScrapedOpportunity[]> {
  const res = await fetch(detailUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return [];
  const html = await res.text();
  const $ = cheerio.load(html);

  const results: ScrapedOpportunity[] = [];

  $("tr.over").each((_, rowEl) => {
    if (results.length >= MAX_SLOTS_PER_PROGRAM) return false;

    const row = $(rowEl);
    if (/closed/i.test(row.text())) return; // registration window already closed

    const parsed = parseSlotDateTime(row.find("td").first().text());
    if (!parsed) return;

    const startsAt = laTimeToUtc(parsed.year, parsed.month, parsed.day, parsed.start.hour, parsed.start.minute);
    const endsAt = parsed.end
      ? laTimeToUtc(parsed.year, parsed.month, parsed.day, parsed.end.hour, parsed.end.minute)
      : new Date(startsAt.getTime() + 3 * 3600_000);

    results.push({
      externalId: `${detailUrl}:${startsAt.toISOString()}`,
      title,
      description: title,
      category: "homelessness",
      neighborhood: "Downtown LA",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      sourceUrl: detailUrl,
    });

    return undefined;
  });

  return results;
}

/**
 * Union Rescue Mission's volunteer sign-up runs on a Cervis portal (the
 * one urm.org/volunteer embeds in an iframe). The list page only has one
 * entry per recurring program with a date *range*, not real shift dates
 * -- the actual dated slots are on each program's own detail page, so
 * this fetches each program's page in turn.
 */
export function createUrmAdapter(): ScrapeAdapter {
  return {
    slug: "html:urm",
    name: "Union Rescue Mission",
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

      const programs = new Map<string, { title: string; url: string }>();

      $('a[href*="eventdetail.php?event_id="]').each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const url = new URL(href, "https://www.cervistech.com").toString();
        const eventId = new URL(url).searchParams.get("event_id");
        if (!eventId || SKIP_EVENT_IDS.has(eventId) || programs.has(eventId)) return;

        const title = $(el).find("div.wrapper span").first().text().trim();
        if (!title) return;

        programs.set(eventId, { title, url });
      });

      const perProgram = await mapWithConcurrency(
        Array.from(programs.values()),
        5,
        ({ title, url }) => fetchProgramSlots(url, title)
      );

      return perProgram.flat();
    },
  };
}
