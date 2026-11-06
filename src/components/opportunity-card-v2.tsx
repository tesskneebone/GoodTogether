import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_SYMBOLS } from "@/lib/category-symbols";
import { OpportunityImage } from "@/components/opportunity-image";
import type { Opportunity } from "@/types/database";

function formatWhen(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function hostName(opp: Opportunity, orgName?: string) {
  return opp.source ? opp.source_name : orgName;
}

/** Horizontal-scroll "Coming Up Soon" carousel card. */
export function OpportunityCardCarousel({ opp, orgName }: { opp: Opportunity; orgName?: string }) {
  return (
    <Link
      href={`/opportunities/${opp.id}`}
      className="flex-shrink-0 w-[270px] snap-start rounded-xl bg-surface-container-lowest shadow-[0_4px_20px_-2px_rgba(27,77,62,0.06),0_2px_6px_-1px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col group"
    >
      <div className="relative w-full h-36 bg-surface-container">
        <OpportunityImage src={opp.image_url} alt={opp.title} className="h-full w-full object-cover" />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold shadow-sm">
          <span className="material-symbols-outlined text-[13px]">{CATEGORY_SYMBOLS[opp.category]}</span>
          {CATEGORY_LABELS[opp.category]}
        </div>
      </div>
      <div className="p-space-md flex flex-col gap-space-xs flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
            <span className="truncate font-semibold text-secondary">{hostName(opp, orgName) ?? "GoodTogether"}</span>
            <span className="flex items-center gap-0.5 flex-shrink-0">
              <span className="material-symbols-outlined text-[14px]">pin_drop</span>
              {opp.neighborhood}
            </span>
          </div>
          <h3 className="font-headline-sm text-[1.0625rem] text-primary font-bold leading-snug line-clamp-1 mt-0.5">
            {opp.title}
          </h3>
        </div>
        <span className="text-body-sm font-semibold text-on-surface-variant">{formatWhen(opp.starts_at)}</span>
      </div>
    </Link>
  );
}

/** Stacked vertical list card for the main "Browse by cause" list. */
export function OpportunityCardStack({ opp, orgName }: { opp: Opportunity; orgName?: string }) {
  const symbol = CATEGORY_SYMBOLS[opp.category];
  return (
    <Link
      href={`/opportunities/${opp.id}`}
      className="rounded-xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(27,77,62,0.06),0_2px_6px_-1px_rgba(15,23,42,0.04)] flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
              {CATEGORY_LABELS[opp.category]}
            </span>
            {hostName(opp, orgName) && (
              <span className="text-on-surface-variant font-label-md text-label-md font-semibold truncate">
                {hostName(opp, orgName)}
              </span>
            )}
          </div>
          <h3 className="font-headline-sm text-[1.125rem] text-primary font-bold leading-snug">{opp.title}</h3>
        </div>
        <span className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary flex-shrink-0">
          <span className="material-symbols-outlined text-[22px]">{symbol}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-on-surface-variant font-body-sm text-body-sm">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
          {formatWhen(opp.starts_at)}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-secondary">place</span>
          {opp.neighborhood}
          {opp.address && <span> &middot; {opp.address}</span>}
        </div>
      </div>
      <div className="flex items-center justify-end pt-1 mt-0.5">
        <span className="px-3 py-1.5 rounded-xl font-label-md text-label-md font-semibold bg-primary-container text-on-primary">
          View details
        </span>
      </div>
    </Link>
  );
}
