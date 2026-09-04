import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_LABELS, LA_NEIGHBORHOODS } from "@/lib/constants";
import { OpportunitiesView } from "@/components/opportunities-view";
import type { Opportunity, OpportunityCategory } from "@/types/database";

type SortOption = "soonest" | "spots";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    neighborhood?: string;
    q?: string;
    from?: string;
    to?: string;
    sort?: string;
  }>;
}) {
  const { category, neighborhood, q, from, to, sort } = await searchParams;
  const supabase = await createClient();
  const sortOption: SortOption = sort === "spots" ? "spots" : "soonest";

  let query = supabase
    .from("opportunities")
    .select("*")
    .gte("starts_at", from ? new Date(from).toISOString() : new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (category) query = query.eq("category", category as OpportunityCategory);
  if (neighborhood) query = query.eq("neighborhood", neighborhood);
  if (to) query = query.lte("starts_at", new Date(`${to}T23:59:59`).toISOString());
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error } = await query;

  const opportunities: Opportunity[] = data ?? [];
  if (sortOption === "spots") {
    opportunities.sort(
      (a, b) => b.spots_total - b.spots_filled - (a.spots_total - a.spots_filled)
    );
  }

  const hasFilters = category || neighborhood || q || from || to || sort;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">
        Volunteer Opportunities in LA
      </h1>
      <p className="mt-1 text-stone-500">
        Search, filter by cause or neighborhood, and find your fit.
      </p>

      <form className="mt-6 space-y-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by keyword (e.g. beach cleanup, tutoring)"
          className="input"
        />
        <div className="flex flex-wrap gap-3">
          <select name="category" defaultValue={category ?? ""} className="input w-auto">
            <option value="">All causes</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            name="neighborhood"
            defaultValue={neighborhood ?? ""}
            className="input w-auto"
          >
            <option value="">All neighborhoods</option>
            {LA_NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            title="Earliest date"
            className="input w-auto"
          />
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            title="Latest date"
            className="input w-auto"
          />
          <select name="sort" defaultValue={sortOption} className="input w-auto">
            <option value="soonest">Soonest first</option>
            <option value="spots">Most spots left</option>
          </select>
          <button type="submit" className="btn-primary">
            Apply
          </button>
          {hasFilters && (
            <Link href="/opportunities" className="btn-secondary">
              Clear
            </Link>
          )}
        </div>
      </form>

      {error && (
        <p className="mt-6 text-sm text-red-600">
          Couldn&apos;t load opportunities: {error.message}
        </p>
      )}

      {!error && opportunities.length === 0 && (
        <div className="card mt-8 p-8 text-center text-stone-500">
          No opportunities match those filters yet. Try a different search, or{" "}
          <Link href="/opportunities" className="text-brand-700 hover:underline">
            view all
          </Link>
          .
        </div>
      )}

      {opportunities.length > 0 && <OpportunitiesView opportunities={opportunities} />}
    </div>
  );
}
