"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { OpportunityCardStack } from "@/components/opportunity-card-v2";
import type { Opportunity } from "@/types/database";

const OpportunitiesMap = dynamic(
  () => import("@/components/opportunities-map").then((mod) => mod.OpportunitiesMap),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse rounded-xl bg-surface-container" /> }
);

const PAGE_SIZE = 24;

export function OpportunitiesView({
  opportunities,
  orgNamesById = {},
  initialView = "list",
}: {
  opportunities: Opportunity[];
  orgNamesById?: Record<string, string>;
  initialView?: "list" | "map";
}) {
  const [view, setView] = useState<"list" | "map">(initialView);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleOpportunities = opportunities.slice(0, visibleCount);

  return (
    <div>
      <div className="inline-flex rounded-full border border-outline-variant bg-surface-container-lowest p-1 text-sm">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-full px-3.5 py-1.5 font-label-md text-label-md font-semibold transition ${
            view === "list" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded-full px-3.5 py-1.5 font-label-md text-label-md font-semibold transition ${
            view === "map" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Map
        </button>
      </div>

      {view === "list" ? (
        <>
          <div className="mt-4 flex flex-col gap-space-md">
            {visibleOpportunities.map((opp) => (
              <OpportunityCardStack
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
                className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-5 py-2.5 font-label-md text-label-md font-semibold text-primary shadow-sm hover:bg-surface-container transition"
              >
                Load more ({opportunities.length - visibleCount} more)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4">
          <OpportunitiesMap opportunities={opportunities} />
        </div>
      )}
    </div>
  );
}
