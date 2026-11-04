import * as cheerio from "cheerio";
import { LA_NEIGHBORHOODS } from "@/lib/constants";
import { guessCategory } from "@/lib/scrape/guess-category";
import { isPathAllowed, BOT_USER_AGENT } from "@/lib/scrape/robots";
import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

export interface HtmlAdapterConfig {
  slug: string;
  name: string;
  /** The page listing opportunities, e.g. an org's "Volunteer" page. */
  listUrl: string;
  /** CSS selector matching each opportunity "card"/row on the list page. */
  itemSelector: string;
  selectors: {
    /** Relative to the matched item. */
    title: string;
    /** Relative to the matched item; its href becomes the listing link. */
    link: string;
    description?: string;
    /** Free text containing a parseable date, if the page has one. */
    date?: string;
  };
  defaultNeighborhood?: string;
  defaultDurationHours?: number;
  /**
   * Adapters are off by default. Before flipping this on, check the
   * site's robots.txt (this adapter also checks at request time) and its
   * Terms of Service -- not every site that *can* be scraped permits it.
   */
  enabled?: boolean;
}

/**
 * Generic, config-driven adapter for an individual site's own listings
 * page, using CSS selectors instead of a one-off scraper per nonprofit.
 * Checks robots.txt before every fetch and fails closed if disallowed.
 */
export function createHtmlAdapter(config: HtmlAdapterConfig): ScrapeAdapter {
  const {
    slug,
    name,
    listUrl,
    itemSelector,
    selectors,
    defaultNeighborhood = "Downtown LA",
    defaultDurationHours = 3,
    enabled = false,
  } = config;

  return {
    slug,
    name,
    enabled,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const allowed = await isPathAllowed(listUrl);
      if (!allowed) {
        throw new Error(
          `robots.txt disallows ${listUrl} for ${BOT_USER_AGENT} -- adapter left disabled`
        );
      }

      const res = await fetch(listUrl, {
        headers: { "User-Agent": `${BOT_USER_AGENT}/1.0 (+https://goodtogether.vercel.app)` },
      });
      if (!res.ok) {
        throw new Error(`${listUrl} responded ${res.status}`);
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const base = new URL(listUrl);
      const opportunities: ScrapedOpportunity[] = [];

      $(itemSelector).each((_, el) => {
        const item = $(el);
        const title = item.find(selectors.title).first().text().trim();
        const hrefRaw = item.find(selectors.link).first().attr("href");
        if (!title || !hrefRaw) return;

        const sourceUrl = new URL(hrefRaw, base).toString();
        const description = selectors.description
          ? item.find(selectors.description).first().text().trim()
          : title;

        let startsAt = new Date();
        if (selectors.date) {
          const dateText = item.find(selectors.date).first().text().trim();
          const parsed = new Date(dateText);
          if (!Number.isNaN(parsed.getTime())) startsAt = parsed;
        }
        const endsAt = new Date(startsAt.getTime() + defaultDurationHours * 3600_000);

        const text = `${title} ${description}`;
        const lower = text.toLowerCase();
        const neighborhood =
          LA_NEIGHBORHOODS.find((n) => lower.includes(n.toLowerCase())) ??
          defaultNeighborhood;

        opportunities.push({
          externalId: sourceUrl,
          title,
          description: description || title,
          category: guessCategory(text),
          neighborhood,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sourceUrl,
        });
      });

      return opportunities;
    },
  };
}
