import Link from "next/link";

interface LeaderRow {
  volunteer_id: string;
  full_name: string;
  avatar_url: string | null;
  total_hours: number;
}

interface SuggestedPerson {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  neighborhood: string | null;
}

export function FeedSidebarDiscover({
  weeklyLeaders,
  suggestedPeople,
}: {
  weeklyLeaders: LeaderRow[];
  suggestedPeople: SuggestedPerson[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {weeklyLeaders.length > 0 && (
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex items-baseline justify-between">
            <h3 className="font-label-lg text-label-lg font-bold text-on-surface">Top this week</h3>
            <Link href="/leaderboard?range=week" className="text-[11px] font-semibold text-secondary hover:underline">
              See all
            </Link>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {weeklyLeaders.map((row, i) => (
              <li key={row.volunteer_id} className="flex items-center gap-2">
                <span className="w-4 text-center text-[11px] font-bold text-outline">{i + 1}</span>
                {row.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-fixed text-[11px] font-bold text-on-secondary-fixed-variant">
                    {row.full_name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
                <span className="flex-1 truncate font-body-sm text-body-sm text-on-surface">
                  {row.full_name}
                </span>
                <span className="font-label-md text-label-md font-bold text-primary">{row.total_hours}h</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestedPeople.length > 0 && (
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex items-baseline justify-between">
            <h3 className="font-label-lg text-label-lg font-bold text-on-surface">People to follow</h3>
            <Link href="/people" className="text-[11px] font-semibold text-secondary hover:underline">
              See all
            </Link>
          </div>
          <ul className="mt-2 flex flex-col gap-2.5">
            {suggestedPeople.map((p) => (
              <li key={p.id}>
                <Link href={`/u/${p.username}`} className="flex items-center gap-2">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-fixed text-xs font-bold text-on-secondary-fixed-variant">
                      {p.full_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body-sm text-body-sm font-semibold text-on-surface">
                      {p.full_name}
                    </span>
                    <span className="block truncate text-[11px] text-outline">
                      {p.neighborhood ?? `@${p.username}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <h3 className="font-label-lg text-label-lg font-bold text-on-surface">GoodTogether LA</h3>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Connecting Angelenos with real volunteer opportunities across LA.
        </p>
        <div className="mt-2 flex flex-col gap-1 text-body-sm text-body-sm">
          <Link href="/about" className="text-secondary hover:underline">
            Our mission
          </Link>
          <Link href="/opportunities" className="text-secondary hover:underline">
            Browse opportunities
          </Link>
        </div>
      </div>
    </div>
  );
}
