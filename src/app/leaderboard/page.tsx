import { createClient } from "@/lib/supabase/server";
import type { VolunteerHours } from "@/types/database";

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

function LeaderboardList({ rows }: { rows: VolunteerHours[] }) {
  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-stone-500">
        No volunteer hours logged yet. Sign up for an opportunity to be the first!
      </div>
    );
  }

  return (
    <ol className="card divide-y divide-stone-100">
      {rows.map((row, i) => (
        <li key={row.volunteer_id} className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="w-8 text-center text-lg">
              {MEDALS[i] ?? (
                <span className="text-sm font-medium text-stone-400">{i + 1}</span>
              )}
            </span>
            {row.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sunset-300 to-brand-400 text-xs font-bold text-white">
                {row.full_name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
            <span className="font-medium text-stone-900">{row.full_name}</span>
          </div>
          <span className="font-semibold text-brand-700">{row.total_hours}h</span>
        </li>
      ))}
    </ol>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const isWeekly = range === "week";
  const supabase = await createClient();

  const { data } = await supabase
    .from(isWeekly ? "volunteer_hours_weekly" : "volunteer_hours_alltime")
    .select("*")
    .gt("total_hours", 0)
    .order("total_hours", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Leaderboard</h1>
      <p className="mt-1 text-stone-500">
        Top volunteers by hours contributed across LA.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-stone-300 bg-white p-1 text-sm">
        <a
          href="/leaderboard"
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            !isWeekly ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          All time
        </a>
        <a
          href="/leaderboard?range=week"
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            isWeekly ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          This week
        </a>
      </div>

      <div className="mt-6">
        <LeaderboardList rows={data ?? []} />
      </div>
    </div>
  );
}
