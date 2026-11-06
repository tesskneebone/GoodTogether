import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_LABELS, LA_NEIGHBORHOODS } from "@/lib/constants";
import { CATEGORY_SYMBOLS } from "@/lib/category-symbols";
import { OpportunitiesView } from "@/components/opportunities-view";
import { OpportunityCardCarousel } from "@/components/opportunity-card-v2";
import type { Opportunity, OpportunityCategory } from "@/types/database";

type SortOption = "soonest";

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
    view?: string;
  }>;
}) {
  const { category, neighborhood, q, from, to, sort, view } = await searchParams;
  const initialView = view === "map" ? "map" : "list";

  function chipHref(nextCategory: string | null) {
    const params = new URLSearchParams();
    if (nextCategory) params.set("category", nextCategory);
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    return qs ? `/opportunities?${qs}` : "/opportunities";
  }
  const supabase = await createClient();
  const sortOption: SortOption = "soonest";
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

  const hasFilters = category || neighborhood || q || from || to || sort;
  const comingUpSoon = [...opportunities]
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 8);

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
    <div className="flex flex-col w-full pb-8">
      <div className="flex flex-col gap-space-sm px-margin pt-space-sm">
        <div className="flex items-center justify-between gap-space-xs">
          <h1 className="font-headline-sm text-headline-sm truncate text-primary">Los Angeles</h1>
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-label-md flex-shrink-0">
            <span className="material-symbols-outlined text-[15px]">volunteer_activism</span>
            {opportunities.length} opportunities
          </span>
        </div>

        <form className="flex items-center gap-space-sm" method="get">
          <div className="relative flex-1 flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search opportunities, causes, or non-profits"
              className="w-full h-12 pl-10 pr-4 rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-sm text-body-sm shadow-[0_2px_8px_rgba(27,77,62,0.05)] focus:outline-none focus:ring-2 focus:ring-secondary-fixed"
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-[0_2px_8px_rgba(27,77,62,0.05)] flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">tune</span>
          </button>
        </form>

        {/* Category chips */}
        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar -mx-margin px-margin py-1">
          <Link
            href={chipHref(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
              !category
                ? "bg-primary-container text-on-primary shadow-sm"
                : "bg-surface-container-lowest text-on-surface-variant shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:text-primary"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={chipHref(c)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-colors ${
                category === c
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{CATEGORY_SYMBOLS[c]}</span>
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>

        {/* Secondary filters */}
        <form className="flex flex-wrap items-center gap-2" method="get">
          {q && <input type="hidden" name="q" value={q} />}
          {category && <input type="hidden" name="category" value={category} />}
          <select
            name="neighborhood"
            defaultValue={neighborhood ?? ""}
            className="h-9 rounded-full border border-outline-variant bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface"
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
            className="h-9 rounded-full border border-outline-variant bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface"
          />
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            title="Latest date"
            className="h-9 rounded-full border border-outline-variant bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface"
          />
          <select
            name="sort"
            defaultValue={sortOption}
            className="h-9 rounded-full border border-outline-variant bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface"
          >
            <option value="soonest">Soonest first</option>
          </select>
          <button
            type="submit"
            className="h-9 rounded-full bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary"
          >
            Apply
          </button>
          {hasFilters && (
            <Link
              href="/opportunities"
              className="h-9 flex items-center rounded-full border border-outline-variant px-4 font-label-md text-label-md text-on-surface-variant"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {error && (
        <p className="mx-margin mt-6 font-body-sm text-body-sm text-error">
          Couldn&apos;t load opportunities: {error.message}
        </p>
      )}

      {!error && opportunities.length === 0 && (
        <div className="mx-margin mt-8 rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-[0_4px_20px_-2px_rgba(27,77,62,0.06)]">
          No opportunities match those filters yet. Try a different search, or{" "}
          <Link href="/opportunities" className="text-secondary hover:underline">
            view all
          </Link>
          .
        </div>
      )}

      {comingUpSoon.length > 0 && (
        <section className="flex flex-col mt-space-lg">
          <div className="flex items-baseline justify-between px-margin mb-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                Coming Up Soon
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Real volunteer opportunities with verified LA non-profits
              </p>
            </div>
          </div>
          <div className="flex gap-space-md overflow-x-auto no-scrollbar px-margin pb-2 snap-x snap-mandatory">
            {comingUpSoon.map((opp) => (
              <OpportunityCardCarousel
                key={opp.id}
                opp={opp}
                orgName={opp.org_id ? orgNamesById[opp.org_id] : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {opportunities.length > 0 && (
        <section className="flex flex-col mt-space-lg px-margin">
          <div className="flex items-baseline justify-between mb-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                Browse by Cause &amp; Action
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Make a difference with verified Los Angeles causes
              </p>
            </div>
          </div>
          <OpportunitiesView
            opportunities={opportunities}
            orgNamesById={orgNamesById}
            initialView={initialView}
          />
        </section>
      )}
    </div>
  );
}
