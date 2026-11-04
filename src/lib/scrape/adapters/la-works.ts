import { LA_NEIGHBORHOODS } from "@/lib/constants";
import { guessCategory } from "@/lib/scrape/guess-category";
import { laTimeToUtc } from "@/lib/scrape/la-time";
import { BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { OpportunityCategory } from "@/types/database";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

const SEARCH_PAGE_URL = "https://volunteer.laworks.com/search";
const LISTING_ENDPOINT = "https://volunteer.laworks.com/search/RetrieveFirstLoadForListingInSearch";
const USER_AGENT = `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)`;

interface LaWorksItem {
  SID?: string;
  Title?: string;
  OrganizationName?: string;
  OccurrenceUrl?: string;
  StartDateTimeValue?: string;
  Duration?: string;
  Location?: string;
  Type?: string;
}

interface LaWorksResponse {
  listingOpportunities?: string;
}

function extractSessionCookie(res: Response): string | null {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    const cookies = headers.getSetCookie();
    if (cookies.length > 0) return cookies.map((c) => c.split(";")[0]).join("; ");
  }
  const single = res.headers.get("set-cookie");
  return single ? single.split(";")[0] : null;
}

/**
 * StartDateTimeValue is formatted like an ISO UTC timestamp (trailing Z)
 * but is actually LA wall-clock time -- a value of
 * "2026-11-05T09:00:00Z" is 9:00 AM Pacific, not 9:00 AM UTC.
 */
function parseMislabeledUtc(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  return laTimeToUtc(Number(y), Number(mo), Number(d), Number(h), Number(mi));
}

function parseDurationHours(duration: string | undefined): number {
  const match = duration?.match(/(\d+(?:\.\d+)?)\s*hour/i);
  return match ? Number(match[1]) : 3;
}

// Items carry no issue-area field, so category is approximated from the
// title + organization name before falling back to the shared keyword
// guesser.
function inferCategory(title: string, org: string): OpportunityCategory {
  const text = `${title} ${org}`.toLowerCase();
  if (/\banimal\b|\bdog\b|\bcat\b|\bpaws\b|\bhumane\b/.test(text)) return "animal_welfare";
  if (/senior|elder/.test(text)) return "seniors";
  if (/blood|health|clinic|wellness|hospital/.test(text)) return "health";
  if (/\bart\b|mural|museum|barnsdall|gallery/.test(text)) return "arts_culture";
  if (/disaster|fire collaborative|emergency|relief/.test(text)) return "disaster_relief";
  if (/youth|kids|child|student|family/.test(text)) return "youth";
  return guessCategory(text);
}

function findNeighborhood(text: string): string {
  const lower = text.toLowerCase();
  return LA_NEIGHBORHOODS.find((n) => lower.includes(n.toLowerCase())) ?? "Downtown LA";
}

/**
 * L.A. Works is LA's local HandsOn Network-affiliate volunteer center
 * (not a commercial marketplace), listing dated shifts across ~100 LA
 * nonprofits. Its search results load via an internal, undocumented JSON
 * endpoint rather than a public API -- this could break if the site
 * changes. Pagination past the first 50 results returned a server error
 * during research, so only that first page is read; it's still real,
 * dated, sign-up-able content across categories no single-org source
 * here covers (animal welfare, health, arts, disaster relief, and more
 * senior/youth events).
 */
export function createLaWorksAdapter(): ScrapeAdapter {
  return {
    slug: "json:la-works",
    name: "L.A. Works",
    enabled: true,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const pageRes = await fetch(SEARCH_PAGE_URL, { headers: { "User-Agent": USER_AGENT } });
      if (!pageRes.ok) throw new Error(`${SEARCH_PAGE_URL} responded ${pageRes.status}`);
      const cookie = extractSessionCookie(pageRes);

      const listRes = await fetch(LISTING_ENDPOINT, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: "blockId=48911",
      });
      if (!listRes.ok) throw new Error(`${LISTING_ENDPOINT} responded ${listRes.status}`);
      const raw = await listRes.text();

      let outer: LaWorksResponse;
      try {
        outer = JSON.parse(raw);
      } catch {
        throw new Error("L.A. Works response wasn't valid JSON -- the endpoint may have changed");
      }
      if (!outer.listingOpportunities) return [];

      const items: LaWorksItem[] = JSON.parse(outer.listingOpportunities);
      const opportunities: ScrapedOpportunity[] = [];

      for (const item of items) {
        if (item.Type !== "DateAndTimeSpecific") continue;

        const title = item.Title?.trim();
        const org = item.OrganizationName?.trim() ?? "";
        const sourceUrl = item.OccurrenceUrl?.trim();
        if (!title || !sourceUrl || !item.StartDateTimeValue) continue;

        const startsAt = parseMislabeledUtc(item.StartDateTimeValue);
        if (!startsAt) continue;
        const endsAt = new Date(startsAt.getTime() + parseDurationHours(item.Duration) * 3600_000);

        // The same SID can recur across multiple dated occurrences, so the
        // date is folded into the dedup key to keep each one distinct.
        const externalId = `${item.SID ?? sourceUrl}:${startsAt.toISOString()}`;

        opportunities.push({
          externalId,
          title,
          description: org ? `Volunteer with ${org}.` : title,
          category: inferCategory(title, org),
          neighborhood: findNeighborhood(`${title} ${org} ${item.Location ?? ""}`),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sourceUrl,
        });
      }

      return opportunities;
    },
  };
}
