import type { OpportunityCategory } from "@/types/database";

/** A single opportunity as pulled from an external source, before import. */
export interface ScrapedOpportunity {
  /** Stable ID within this source, used to dedupe on re-import (e.g. an RSS guid or a listing's slug). */
  externalId: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  neighborhood: string;
  address?: string;
  startsAt: string;
  endsAt: string;
  /** Link back to the original listing so volunteers can sign up there. */
  sourceUrl: string;
  /** Capacity isn't always published by the source; the importer defaults this when omitted. */
  spotsTotal?: number;
}

export interface ScrapeAdapter {
  /** Short, stable, URL/column-safe identifier, e.g. "rss:la-works". Stored in opportunities.source. */
  slug: string;
  /** Human-readable name shown as attribution, e.g. "LA Works". */
  name: string;
  /** Adapters are opt-in -- disabled ones are skipped by the runner entirely. */
  enabled: boolean;
  fetch(): Promise<ScrapedOpportunity[]>;
}
