import { createRssAdapter } from "./rss";
import { createHtmlAdapter } from "./html";
import { createSeedAdapter } from "./seed";
import type { ScrapeAdapter } from "@/lib/scrape/types";

/**
 * VolunteerMatch and Idealist are listing marketplaces whose inventory
 * *is* their product -- like most sites in that category, their Terms of
 * Service almost certainly prohibit automated scraping of search results
 * (this couldn't be verified from the sandbox this adapter framework was
 * built in, which has no general internet access; confirm the current
 * terms yourself before doing anything here).
 *
 * The right way to pull from either is their official partner/API
 * program, not scraping:
 *   - VolunteerMatch: https://www.volunteermatch.org/ -- has historically
 *     offered a partner API; apply via their nonprofit/partner contact
 *     channels rather than scraping search pages.
 *   - Idealist: https://www.idealist.org/ -- no public scraping-friendly
 *     API as of this writing; reach out directly if you want their data.
 *
 * These stay disabled; nothing fetches from either host unless you
 * deliberately re-enable a HTML adapter against their robots.txt-cleared
 * pages and have confirmed it against their current ToS yourself.
 */
const volunteerMatchStub: ScrapeAdapter = {
  slug: "html:volunteermatch",
  name: "VolunteerMatch",
  enabled: false,
  async fetch() {
    throw new Error(
      "VolunteerMatch adapter intentionally disabled -- see comment in adapters/index.ts. Use their partner API instead of scraping."
    );
  },
};

const idealistStub: ScrapeAdapter = {
  slug: "html:idealist",
  name: "Idealist",
  enabled: false,
  async fetch() {
    throw new Error(
      "Idealist adapter intentionally disabled -- see comment in adapters/index.ts."
    );
  },
};

/**
 * Example RSS adapter. Most city volunteer boards, library systems, and
 * individual nonprofits publish an RSS feed for their events/opportunities
 * page even when they don't advertise it -- look for a feed icon, or try
 * appending /feed or /rss to the events page URL. Replace the feedUrl
 * below with a real one and flip enabled to true.
 */
const exampleRssAdapter = createRssAdapter({
  slug: "rss:example",
  name: "Example Feed",
  feedUrl: "https://example.org/volunteer-opportunities/feed",
  enabled: false,
});

/**
 * Example HTML adapter for a specific nonprofit's own listings page.
 * Inspect the page's markup (right-click -> Inspect) to find real CSS
 * selectors, confirm robots.txt allows the page, and flip enabled: true.
 */
const exampleHtmlAdapter = createHtmlAdapter({
  slug: "html:example",
  name: "Example Nonprofit",
  listUrl: "https://example.org/volunteer",
  itemSelector: ".opportunity-card",
  selectors: {
    title: ".opportunity-title",
    link: "a.opportunity-link",
    description: ".opportunity-description",
    date: ".opportunity-date",
  },
  enabled: false,
});

export const ADAPTERS: ScrapeAdapter[] = [
  volunteerMatchStub,
  idealistStub,
  exampleRssAdapter,
  exampleHtmlAdapter,
  createSeedAdapter(),
];
