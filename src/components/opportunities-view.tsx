"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { OpportunityCard } from "@/components/opportunity-card";
import type { Opportunity } from "@/types/database";

const OpportunitiesMap = dynamic(
  () => import("@/components/opportunities-map").then((mod) => mod.OpportunitiesMap),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse rounded-xl bg-stone-100" /> }
);

export function OpportunitiesView({ opportunities }: { opportunities: Opportunity[] }) {
  const [view, setView] = useState<"list" | "map">("list");

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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <OpportunitiesMap opportunities={opportunities} />
        </div>
      )}
    </div>
  );
}
