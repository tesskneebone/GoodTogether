import { createAdminClient } from "@/lib/supabase/admin";
import { getCategoryPhoto } from "@/lib/unsplash";
import { mapWithConcurrency } from "./concurrency";
import type { ScrapeAdapter, ScrapedOpportunity } from "./types";

export interface ImportSummary {
  slug: string;
  name: string;
  found: number;
  upserted: number;
  errors: string[];
}

// How many things happen at once -- bounded rather than unlimited so the
// run doesn't hammer Unsplash's rate limit or run every adapter's own
// network calls fully in parallel, but high enough that the whole import
// comfortably finishes inside the cron route's time budget.
const ADAPTER_CONCURRENCY = 6;
const PHOTO_LOOKUP_CONCURRENCY = 5;

// Upper bound on any one source's fetch. A source whose server hangs
// (seen with Galaxy Digital hosts answering 504 after ~60s) would
// otherwise hold its worker for the entire cron budget and get the whole
// run killed -- losing every other source's results along with it.
const ADAPTER_FETCH_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function importAdapter(adapter: ScrapeAdapter, supabase: AdminClient): Promise<ImportSummary> {
  const summary: ImportSummary = {
    slug: adapter.slug,
    name: adapter.name,
    found: 0,
    upserted: 0,
    errors: [],
  };

  let items: ScrapedOpportunity[];
  try {
    items = await withTimeout(adapter.fetch(), ADAPTER_FETCH_TIMEOUT_MS);
  } catch (err) {
    summary.errors.push(`fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return summary;
  }

  summary.found = items.length;
  if (items.length === 0) return summary;

  // One bulk lookup for existing rows instead of one select per item --
  // this and the bulk upsert below are what keep a few hundred imported
  // listings from needing a few hundred sequential Supabase round trips.
  const { data: existingRows, error: selectError } = await supabase
    .from("opportunities")
    .select("external_id, image_url, image_credit, image_credit_url")
    .eq("source", adapter.slug)
    .in("external_id", items.map((item) => item.externalId));

  if (selectError) {
    summary.errors.push(`lookup failed: ${selectError.message}`);
    return summary;
  }

  const existingByExternalId = new Map((existingRows ?? []).map((row) => [row.external_id, row]));

  // Unsplash lookups are the one thing that can't be batched (no bulk
  // endpoint), so they run with bounded concurrency instead of either
  // one-at-a-time (slow) or fully parallel (risks the rate limit).
  const photos = await mapWithConcurrency(items, PHOTO_LOOKUP_CONCURRENCY, async (item) => {
    const existing = existingByExternalId.get(item.externalId);
    if (existing?.image_url) {
      return { url: existing.image_url, credit: existing.image_credit, creditUrl: existing.image_credit_url };
    }
    return getCategoryPhoto(item.category, item.title);
  });

  const rows = items.map((item, i) => {
    const photo = photos[i];
    return {
      title: item.title,
      description: item.description,
      category: item.category,
      neighborhood: item.neighborhood,
      address: item.address ?? null,
      starts_at: item.startsAt,
      ends_at: item.endsAt,
      spots_total: item.spotsTotal ?? 20,
      org_id: null,
      source: adapter.slug,
      source_name: adapter.name,
      source_url: item.sourceUrl,
      external_id: item.externalId,
      image_url: photo?.url ?? null,
      image_credit: photo?.credit ?? null,
      image_credit_url: photo?.creditUrl ?? null,
    };
  });

  const { error: upsertError } = await supabase
    .from("opportunities")
    .upsert(rows, { onConflict: "source,external_id" });

  if (upsertError) {
    summary.errors.push(`upsert failed: ${upsertError.message}`);
  } else {
    summary.upserted = rows.length;
  }

  return summary;
}

/**
 * Runs every enabled adapter and upserts its results into `opportunities`,
 * keyed on (source, external_id) so re-running an import updates existing
 * rows instead of duplicating them. Uses the service-role client since
 * imported rows have no owning org to satisfy the normal insert policy.
 *
 * Adapters run with bounded concurrency, and each adapter's items are
 * looked up and upserted in a single batch rather than one Supabase round
 * trip per item -- with ten-plus real sources now wired up, doing this
 * sequentially risked running past the cron route's time budget.
 */
export async function runImport(adapters: ScrapeAdapter[]): Promise<ImportSummary[]> {
  const supabase = createAdminClient();
  const enabled = adapters.filter((a) => a.enabled);
  return mapWithConcurrency(enabled, ADAPTER_CONCURRENCY, (adapter) => importAdapter(adapter, supabase));
}
