"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { OpportunityCard } from "@/components/opportunity-card";
import type { Opportunity } from "@/types/database";

const OpportunitiesMap = dynamic(
  () => import("@/components/opportunities-map").then((mod) => mod.OpportunitiesMap),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse rounded-xl bg-stone-100" /> }
);

const PAGE_SIZE = 24;

export function OpportunitiesView({
  opportunities,
  orgNamesById = {},
}: {
  opportunities: Opportunity[];
  orgNamesById?: Record<string, string>;
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleOpportunities = opportunities.slice(0, visibleCount);

  return (
    <div>
      <div className="mt-6 inline-flex rounded-lg border border-stone-300 bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            view === "list" ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            view === "map" ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          Map
        </button>
      </div>

      {view === "list" ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                orgName={opp.org_id ? orgNamesById[opp.org_id] : undefined}
              />
            ))}
          </div>
          {visibleCount < opportunities.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="btn-secondary"
              >
                Load more ({opportunities.length - visibleCount} more)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-6">
          <OpportunitiesMap opportunities={opportunities} />
        </div>
      )}
    </div>
  );
}
