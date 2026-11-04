import type { ScrapeAdapter, ScrapedOpportunity } from "@/lib/scrape/types";

/**
 * A curated starter catalog of real, well-known LA-area nonprofits, used
 * to populate the app with content to browse. This is NOT a live scrape
 * -- the adapter framework this plugs into has no way to browse arbitrary
 * sites from where it was built, so these entries are illustrative
 * (plausible scheduling, not confirmed against each org's current
 * calendar) rather than guaranteed-current listings. Every one links out
 * to the organization's real site, same as any other imported listing,
 * so volunteers land on the actual source to find what's really open.
 */
interface SeedEntry {
  externalId: string;
  title: string;
  description: string;
  category: ScrapedOpportunity["category"];
  neighborhood: string;
  sourceUrl: string;
  spotsTotal: number;
  /** Days from now the opportunity starts. */
  daysOut: number;
  /** Local hour (0-23) it starts. */
  startHour: number;
  durationHours: number;
}

const ENTRIES: SeedEntry[] = [
  {
    externalId: "la-food-bank-sort",
    title: "Sort & Pack Food Donations",
    description:
      "Help sort and pack donated food for distribution to families across LA County. No experience needed -- the Food Bank trains volunteers on arrival. Closed-toe shoes required.",
    category: "food_security",
    neighborhood: "Downtown LA",
    sourceUrl: "https://www.lafoodbank.org/get-involved/volunteer/",
    spotsTotal: 25,
    daysOut: 4,
    startHour: 9,
    durationHours: 3,
  },
  {
    externalId: "heal-the-bay-beach-cleanup",
    title: "Santa Monica Beach Cleanup",
    description:
      "Join Heal the Bay for a shoreline cleanup -- gloves, bags, and data cards provided. Great for families and first-time volunteers; all ages welcome.",
    category: "environment",
    neighborhood: "Santa Monica",
    sourceUrl: "https://healthebay.org/get-involved/",
    spotsTotal: 40,
    daysOut: 9,
    startHour: 10,
    durationHours: 2,
  },
  {
    externalId: "union-rescue-mission-meal-service",
    title: "Skid Row Meal Service",
    description:
      "Serve a hot meal to residents of Union Rescue Mission's Skid Row campus. Shifts involve food prep, serving, and cleanup alongside the kitchen team.",
    category: "homelessness",
    neighborhood: "Downtown LA",
    sourceUrl: "https://urmla.org/volunteer/",
    spotsTotal: 12,
    daysOut: 6,
    startHour: 16,
    durationHours: 3,
  },
  {
    externalId: "best-friends-la-dog-walking",
    title: "Shelter Dog Walking & Socialization",
    description:
      "Walk and socialize adoptable dogs at the shelter to help them stay happy and ready for their forever homes. Orientation required for first-time volunteers.",
    category: "animal_welfare",
    neighborhood: "San Fernando Valley",
    sourceUrl: "https://bestfriends.org/locations/best-friends-los-angeles",
    spotsTotal: 15,
    daysOut: 3,
    startHour: 11,
    durationHours: 2,
  },
  {
    externalId: "la-conservation-corps-planting",
    title: "Native Tree Planting Day",
    description:
      "Plant native trees and restore habitat with the LA Conservation Corps. Tools and gloves provided -- wear clothes you don't mind getting dirty.",
    category: "environment",
    neighborhood: "East LA",
    sourceUrl: "https://www.lacorps.org/get-involved",
    spotsTotal: 30,
    daysOut: 13,
    startHour: 9,
    durationHours: 4,
  },
  {
    externalId: "826la-writing-workshop",
    title: "After-School Writing Workshop Helper",
    description:
      "Support a free after-school writing workshop for local students -- help with brainstorming, typing up stories, and one-on-one encouragement. No teaching experience required.",
    category: "education",
    neighborhood: "Echo Park",
    sourceUrl: "https://826la.org/volunteer/",
    spotsTotal: 10,
    daysOut: 7,
    startHour: 15,
    durationHours: 2,
  },
  {
    externalId: "bbbs-la-mentor-info-session",
    title: "Big Brothers Big Sisters Mentor Info Session",
    description:
      "Learn what it takes to become a one-on-one mentor to a young person in LA. This session covers the matching process, time commitment, and how to get started.",
    category: "youth",
    neighborhood: "Mid-City",
    sourceUrl: "https://www.bbbsla.org/volunteer/",
    spotsTotal: 20,
    daysOut: 11,
    startHour: 18,
    durationHours: 1,
  },
  {
    externalId: "downtown-womens-center-donations",
    title: "Donation Sorting for Women Experiencing Homelessness",
    description:
      "Sort and organize donated clothing and hygiene items for women served by the Downtown Women's Center. Help keep the donation closet organized and ready.",
    category: "homelessness",
    neighborhood: "Downtown LA",
    sourceUrl: "https://www.downtownwomenscenter.org/get-involved/",
    spotsTotal: 10,
    daysOut: 5,
    startHour: 13,
    durationHours: 3,
  },
  {
    externalId: "para-los-ninos-tutoring",
    title: "Elementary Reading Buddy",
    description:
      "Be a reading buddy for elementary-age students at Para Los Ninos -- one-on-one or small-group reading support in a supportive after-school setting.",
    category: "youth",
    neighborhood: "Boyle Heights",
    sourceUrl: "https://paralosninos.org/volunteer/",
    spotsTotal: 8,
    daysOut: 8,
    startHour: 15,
    durationHours: 2,
  },
  {
    externalId: "pasadena-humane-cat-socialization",
    title: "Cat Socialization Volunteer",
    description:
      "Spend time with shelter cats to help keep them comfortable and sociable while they wait for adoption. Quiet, low-pressure shifts -- great for cat lovers of any experience level.",
    category: "animal_welfare",
    neighborhood: "Pasadena",
    sourceUrl: "https://www.pasadenahumane.org/volunteer/",
    spotsTotal: 10,
    daysOut: 10,
    startHour: 10,
    durationHours: 2,
  },
];

export function createSeedAdapter(): ScrapeAdapter {
  return {
    slug: "seed:la-starter-catalog",
    name: "LA Volunteer Starter Catalog",
    enabled: true,
    async fetch(): Promise<ScrapedOpportunity[]> {
      const now = Date.now();
      return ENTRIES.map((entry) => {
        const startsAt = new Date(now + entry.daysOut * 86_400_000);
        startsAt.setHours(entry.startHour, 0, 0, 0);
        const endsAt = new Date(startsAt.getTime() + entry.durationHours * 3_600_000);

        return {
          externalId: entry.externalId,
          title: entry.title,
          description: entry.description,
          category: entry.category,
          neighborhood: entry.neighborhood,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sourceUrl: entry.sourceUrl,
          spotsTotal: entry.spotsTotal,
        };
      });
    },
  };
}
