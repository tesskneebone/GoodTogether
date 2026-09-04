import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Opportunity } from "@/types/database";

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const spotsLeft = opp.spots_total - opp.spots_filled;
  return (
    <Link
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
}
