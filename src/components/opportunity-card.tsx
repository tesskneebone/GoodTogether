import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { OpportunityImage } from "@/components/opportunity-image";
import type { Opportunity } from "@/types/database";

function formatDuration(startsAt: string, endsAt: string): string {
  const hours = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 3600_000;
  if (hours <= 0) return "";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours >= 5) return "Half-day";
  const rounded = Math.round(hours * 2) / 2;
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} hr${rounded === 1 ? "" : "s"}`;
}

export function OpportunityCard({ opp, orgName }: { opp: Opportunity; orgName?: string | null }) {
  const spotsLeft = opp.spots_total - opp.spots_filled;
  const isImported = !!opp.source;
  const hostName = isImported ? opp.source_name : orgName;
  const duration = formatDuration(opp.starts_at, opp.ends_at);

  return (
    <Link href={`/opportunities/${opp.id}`} className="card-interactive block overflow-hidden">
      <OpportunityImage src={opp.image_url} alt={opp.title} className="h-36 w-full object-cover" />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {CATEGORY_LABELS[opp.category]}
          </span>
          {isImported && (
            <span className="inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
              Imported
            </span>
          )}
        </div>
        <h3 className="mt-3 font-semibold text-stone-900">{opp.title}</h3>
        {hostName && <p className="mt-0.5 text-sm text-stone-500">{hostName}</p>}

        <div className="mt-3 space-y-1 text-sm text-stone-500">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {opp.neighborhood}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {new Date(opp.starts_at).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {", "}
            {new Date(opp.starts_at).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
            {duration && ` · ${duration}`}
          </p>
          {!isImported && (
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className={spotsLeft <= 0 ? "font-medium text-red-600" : "font-medium text-brand-700"}>
                {spotsLeft <= 0 ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
