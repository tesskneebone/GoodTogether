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
  const trimmedQuery = q?.trim() ?? "";

  // Returns a fresh query with the non-text filters applied, so it can be
  // reused as the starting point for several separate text-match queries
  // below (rather than building one .or() string from user input -- see
  // the same pattern, and why, on the /people search page).
  function baseQuery() {
    let builder = supabase
      .from("opportunities")
      .select("*")
      .gte("starts_at", from ? new Date(from).toISOString() : new Date().toISOString());

    if (category) {
      const categories = category.split(",") as OpportunityCategory[];
      builder =
        categories.length > 1 ? builder.in("category", categories) : builder.eq("category", categories[0]);
    }
    if (neighborhood) builder = builder.eq("neighborhood", neighborhood);
    if (to) builder = builder.lte("starts_at", new Date(`${to}T23:59:59`).toISOString());
    return builder;
  }

  let opportunities: Opportunity[] = [];
  let error: { message: string } | null = null;

  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    const { data: matchingOrgs } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "org")
      .ilike("org_name", pattern);
    const matchingOrgIds = (matchingOrgs ?? []).map((o) => o.id);

    const [byTitle, byDescription, bySourceName, byOrg] = await Promise.all([
      baseQuery().ilike("title", pattern),
      baseQuery().ilike("description", pattern),
      // Imported listings (scraped from a real org's own site) have no
      // profiles row at all -- their org's name lives in source_name, not
      // org_id -- so this is what makes those searchable by org name.
      baseQuery().ilike("source_name", pattern),
      matchingOrgIds.length > 0 ? baseQuery().in("org_id", matchingOrgIds) : Promise.resolve({ data: [], error: null }),
    ]);

    error = byTitle.error ?? byDescription.error ?? bySourceName.error ?? byOrg.error ?? null;

    const byId = new Map<string, Opportunity>();
    for (const row of [
      ...(byTitle.data ?? []),
      ...(byDescription.data ?? []),
      ...(bySourceName.data ?? []),
      ...(byOrg.data ?? []),
    ]) {
      byId.set(row.id, row);
    }
    opportunities = Array.from(byId.values());
  } else {
    const { data, error: queryError } = await baseQuery();
    opportunities = data ?? [];
    error = queryError;
  }

  opportunities.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  if (sortOption === "spots") {
    opportunities.sort(
      (a, b) => b.spots_total - b.spots_filled - (a.spots_total - a.spots_filled)
    );
  }

  const hasFilters = category || neighborhood || q || from || to || sort;

  const orgIds = Array.from(
    new Set(opportunities.map((o) => o.org_id).filter((id): id is string => !!id))
  );
  const orgNamesById: Record<string, string> = {};
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("profiles")
      .select("id, org_name, full_name")
      .in("id", orgIds);
    for (const org of orgs ?? []) {
      orgNamesById[org.id] = org.org_name ?? org.full_name;
    }
  }

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

      {opportunities.length > 0 && (
        <OpportunitiesView opportunities={opportunities} orgNamesById={orgNamesById} />
      )}
    </div>
  );
}
