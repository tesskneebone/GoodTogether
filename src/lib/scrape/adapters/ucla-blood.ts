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

// Drives are mostly at schools and churches across the county, in cities
// that aren't in LA_NEIGHBORHOODS -- map each to the nearest region we do
// have so they don't all collapse onto the "West LA" fallback.
const CITY_REGIONS: Record<string, string> = {
  "redondo beach": "South Bay",
  "manhattan beach": "South Bay",
  "hermosa beach": "South Bay",
  "el segundo": "South Bay",
  hawthorne: "South Bay",
  torrance: "South Bay",
  "harbor city": "South Bay",
  wilmington: "South Bay",
  "san pedro": "South Bay",
  "beverly hills": "West LA",
  "west hollywood": "Hollywood",
  "stevenson ranch": "San Fernando Valley",
  "canyon country": "San Fernando Valley",
  valencia: "San Fernando Valley",
  "santa clarita": "San Fernando Valley",
  "san fernando": "San Fernando Valley",
  pacoima: "San Fernando Valley",
  "woodland hills": "San Fernando Valley",
  "west hills": "San Fernando Valley",
  "oak park": "San Fernando Valley",
  lynwood: "South LA",
  "south gate": "South LA",
  compton: "South LA",
  "long beach": "Long Beach",
};

// "Los Angeles" alone covers the whole city; narrow it by ZIP.
const LA_ZIP_REGIONS: Record<string, string> = {
  "90012": "Downtown LA",
  "90013": "Downtown LA",
  "90014": "Downtown LA",
  "90015": "Downtown LA",
  "90017": "Downtown LA",
  "90071": "Downtown LA",
  "90045": "Playa del Rey",
  "90095": "West LA",
  "90024": "West LA",
  "90025": "West LA",
};

function findNeighborhood(city: string | undefined, zip: string | undefined, text: string): string {
  const cityKey = city?.trim().toLowerCase();
  if (cityKey && CITY_REGIONS[cityKey]) return CITY_REGIONS[cityKey];
  if (zip && LA_ZIP_REGIONS[zip]) return LA_ZIP_REGIONS[zip];
  const lower = `${city ?? ""} ${text}`.toLowerCase();
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

        // The month's drives live in a wrapper next to the heading
        // (<h2/> + <div class="mt-3"><div><div class="prose">), not in a
        // direct sibling, so search the heading's parent block.
        const prose = $(headingEl).parent().find("div.prose").first();
        if (prose.length === 0) return;

        prose.find("p").each((_, pEl) => {
          const p = $(pEl);
          // Fields are separated only by <br>; keep them on separate lines
          // so e.g. "...1:30pm" doesn't run into "Torrance, CA 90504".
          p.find("br").replaceWith("\n");
          const lines = p
            .text()
            .split("\n")
            .map((line) => line.replace(/\s+/g, " ").trim())
            .filter(Boolean);
          const text = lines.join(" ");

          const link = p.find("a").first();
          const sourceUrl = link.attr("href")?.trim();
          // Whole link text, not just its <strong>: the markup sometimes
          // splits a name across tags ("<strong>...Schoo</strong>l").
          const title = link.text().replace(/\s+/g, " ").trim();

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

          // Codes can be multi-word ("UCLA WVMC", "POWER TO HELP"), so take
          // the rest of the line rather than one token.
          const codeMatch = lines.map((line) => line.match(/^Code:\s*(.+)$/i)).find(Boolean);
          const locationMatch = lines
            .map((line) => line.match(/^([A-Za-z .'-]+),\s*CA\s*(\d{5})$/))
            .find(Boolean);

          const description = codeMatch
            ? `Community blood drive hosted by ${title}. Use booking code ${codeMatch[1]} when you sign up.`
            : `Community blood drive hosted by ${title}.`;

          opportunities.push({
            externalId: sourceUrl,
            title: `Blood Drive: ${title}`,
            description,
            category: "health",
            neighborhood: findNeighborhood(locationMatch?.[1], locationMatch?.[2], text),
            address: locationMatch ? `${locationMatch[1].trim()}, CA ${locationMatch[2]}` : undefined,
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
