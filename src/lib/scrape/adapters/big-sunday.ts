import { isPathAllowed, BOT_USER_AGENT } from "@/lib/scrape/robots";
import { laTimeToUtc } from "@/lib/scrape/la-time";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

// Big Sunday signs people up for Food Friday through an embedded Wufoo
// form (bigsundayorg.wufoo.com), but Wufoo's own robots.txt disallows
// crawling it entirely -- so this reads bigsunday.org's own page instead,
// which is also the more useful link to hand volunteers anyway (they can
// find the sign-up form from there).
const PAGE_URL = "https://bigsunday.org/get-involved/foodpantry2026/";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;
const ADDRESS = "1741 N. Cherokee Avenue, Los Angeles, CA 90028";
const WEEKS_TO_GENERATE = 8;
const MAX_WEEKS_TO_SCAN = 14; // safety cap in case holiday skips run long

function laNowParts(): { year: number; month: number; day: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

// Big Sunday skips Food Friday around Thanksgiving and the winter holidays
// (confirmed by comparing the form's own date checkboxes, which jump from
// Nov 20 to Dec 4, and stop at Dec 18 rather than running through Dec 25 /
// Jan 1). Approximate those same gaps so generated dates match what
// they'd actually publish, rather than overshooting into a closed week.
function isLikelyClosed(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  // 4th Thursday of November, +1 day.
  const novFirst = new Date(Date.UTC(year, 10, 1));
  const firstThursdayOffset = (4 - novFirst.getUTCDay() + 7) % 7;
  const fourthThursday = 1 + firstThursdayOffset + 21;
  const dayAfterThanksgiving = new Date(Date.UTC(year, 10, fourthThursday + 1));
  if (date.getTime() === dayAfterThanksgiving.getTime()) return true;

  // Within 3 days either side of Christmas or New Year's Day. Check New
  // Year's against both year and year + 1 -- a generated Friday near the
  // turn of the year could be "year"'s own Jan 1 (if it's already January)
  // or the next Jan 1 (if it's still late December).
  const christmas = Date.UTC(year, 11, 25);
  const newYearsThisYear = Date.UTC(year, 0, 1);
  const newYearsNextYear = Date.UTC(year + 1, 0, 1);
  const threeDays = 3 * 86_400_000;
  if (Math.abs(date.getTime() - christmas) <= threeDays) return true;
  if (Math.abs(date.getTime() - newYearsThisYear) <= threeDays) return true;
  if (Math.abs(date.getTime() - newYearsNextYear) <= threeDays) return true;

  return false;
}

/**
 * Big Sunday's Food Pantry runs an indefinitely recurring "Food Friday"
 * (sort & pack food, every Friday 10:00-11:30am) -- there's no per-event
 * listing page to scrape, and the sign-up form's own list of dated
 * checkboxes only runs a few months out before it'd need Big Sunday to
 * republish it for the next stretch. Rather than parse that list (which
 * would go stale the moment it runs out), this confirms the page is
 * still up and still mentions "Friday" (a loose check -- the Wufoo
 * form's own wording isn't necessarily duplicated on this page, and
 * that form can't be fetched directly; see PAGE_URL comment above),
 * then generates the next several upcoming Fridays itself.
 */
export function createBigSundayAdapter(): ScrapeAdapter {
  return {
    slug: "html:big-sunday",
    name: "Big Sunday",
    enabled: true,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const allowed = await isPathAllowed(PAGE_URL);
      if (!allowed) {
        throw new Error(`robots.txt disallows ${PAGE_URL} -- adapter left disabled`);
      }

      const res = await fetch(PAGE_URL, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`${PAGE_URL} responded ${res.status}`);
      const html = await res.text();

      if (!/food\s*pantry/i.test(html) || !/friday/i.test(html)) {
        throw new Error(
          "Big Sunday's Food Pantry page no longer mentions \"Food Pantry\"/\"Friday\" -- page may have changed; skipping import until the adapter is updated"
        );
      }

      const opportunities: ScrapedOpportunity[] = [];
      const { year, month, day, weekday } = laNowParts();
      const daysUntilFriday = (5 - weekday + 7) % 7;
      const firstFriday = Date.UTC(year, month - 1, day + daysUntilFriday);

      for (let i = 0; i < MAX_WEEKS_TO_SCAN && opportunities.length < WEEKS_TO_GENERATE; i++) {
        const d = new Date(firstFriday + i * 7 * 86_400_000);
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth() + 1;
        const dd = d.getUTCDate();

        if (isLikelyClosed(y, m, dd)) continue;

        const startsAt = laTimeToUtc(y, m, dd, 10, 0);
        const endsAt = laTimeToUtc(y, m, dd, 11, 30);
        if (endsAt.getTime() < Date.now()) continue;

        opportunities.push({
          externalId: `big-sunday:food-friday:${y}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
          title: "Food Friday: Sort & Pack Food",
          description:
            "Help Big Sunday sort and pack food at their Food Pantry, which gets distributed to nonprofits and schools across LA for people who need it. All ages welcome, groups too -- if you're bringing more than 4 people, email madison@bigsunday.org first.",
          category: "food_security",
          neighborhood: "Hollywood",
          address: ADDRESS,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sourceUrl: PAGE_URL,
        });
      }

      return opportunities;
    },
  };
}
