import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_LABELS, LA_NEIGHBORHOODS } from "@/lib/constants";
import type { OpportunityCategory } from "@/types/database";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; neighborhood?: string }>;
}) {
  const { category, neighborhood } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select("*")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (category) query = query.eq("category", category as OpportunityCategory);
  if (neighborhood) query = query.eq("neighborhood", neighborhood);

  const { data: opportunities, error } = await query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">
        Volunteer Opportunities in LA
      </h1>
      <p className="mt-1 text-stone-500">
        Filter by cause or neighborhood to find your fit.
      </p>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
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
        <button type="submit" className="btn-primary">
          Apply filters
        </button>
        {(category || neighborhood) && (
          <Link href="/opportunities" className="btn-secondary">
            Clear
          </Link>
        )}
      </form>

      {error && (
        <p className="mt-6 text-sm text-red-600">
          Couldn&apos;t load opportunities: {error.message}
        </p>
      )}

      {!error && (!opportunities || opportunities.length === 0) && (
        <div className="card mt-8 p-8 text-center text-stone-500">
          No opportunities match those filters yet. Try a different search, or{" "}
          <Link href="/opportunities" className="text-brand-700 hover:underline">
            view all
          </Link>
          .
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opportunities?.map((opp) => {
          const spotsLeft = opp.spots_total - opp.spots_filled;
          return (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="card block p-5 transition hover:border-brand-300 hover:shadow-md"
            >
              <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                {CATEGORY_LABELS[opp.category]}
              </span>
              <h3 className="mt-3 font-semibold text-stone-900">{opp.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{opp.neighborhood}</p>
              <p className="mt-1 text-sm text-stone-500">
                {new Date(opp.starts_at).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p
                className={`mt-2 text-sm font-medium ${
                  spotsLeft <= 0 ? "text-red-600" : "text-brand-700"
                }`}
              >
                {spotsLeft <= 0 ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
