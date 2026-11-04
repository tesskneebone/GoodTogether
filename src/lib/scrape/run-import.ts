import { createAdminClient } from "@/lib/supabase/admin";
import { getCategoryPhoto } from "@/lib/unsplash";
import type { ScrapeAdapter } from "./types";

export interface ImportSummary {
  slug: string;
  name: string;
  found: number;
  upserted: number;
  errors: string[];
}

/**
 * Runs every enabled adapter and upserts its results into `opportunities`,
 * keyed on (source, external_id) so re-running an import updates existing
 * rows instead of duplicating them. Uses the service-role client since
 * imported rows have no owning org to satisfy the normal insert policy.
 */
export async function runImport(adapters: ScrapeAdapter[]): Promise<ImportSummary[]> {
  const supabase = createAdminClient();
  const summaries: ImportSummary[] = [];

  for (const adapter of adapters.filter((a) => a.enabled)) {
    const summary: ImportSummary = {
      slug: adapter.slug,
      name: adapter.name,
      found: 0,
      upserted: 0,
      errors: [],
    };

    let items;
    try {
      items = await adapter.fetch();
    } catch (err) {
      summary.errors.push(`fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      summaries.push(summary);
      continue;
    }

    summary.found = items.length;

    for (const item of items) {
      try {
        const { data: existing } = await supabase
          .from("opportunities")
          .select("image_url, image_credit, image_credit_url")
          .eq("source", adapter.slug)
          .eq("external_id", item.externalId)
          .maybeSingle();

        // Only burn an Unsplash lookup for genuinely new listings, or
        // existing ones that still don't have a photo -- not on every
        // sync of an already-illustrated row.
        const photo =
          existing && existing.image_url
            ? { url: existing.image_url, credit: existing.image_credit, creditUrl: existing.image_credit_url }
            : await getCategoryPhoto(item.category, item.title);

        const { error } = await supabase.from("opportunities").upsert(
          {
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
          },
          { onConflict: "source,external_id" }
        );

        if (error) {
          summary.errors.push(`${item.externalId}: ${error.message}`);
        } else {
          summary.upserted += 1;
        }
      } catch (err) {
        summary.errors.push(
          `${item.externalId}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    summaries.push(summary);
  }

  return summaries;
}
