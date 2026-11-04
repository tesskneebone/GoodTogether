import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { KudosButton } from "@/components/kudos-button";
import type { Opportunity, OpportunityCategory } from "@/types/database";

interface FeedItem {
  key: string;
  volunteerId: string;
  category: OpportunityCategory;
  title: string;
  orgName: string | null;
  orgId: string | null;
  hours: number;
  happenedAt: string;
  feedAt: string;
  note?: string | null;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: signupRows }, { data: loggedRows }] = await Promise.all([
    supabase
      .from("signups")
      .select("id, volunteer_id, opportunities(*)")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("logged_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const signupItems: FeedItem[] = (signupRows ?? [])
    .map((row): FeedItem | null => {
      const opp = (
        Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
      ) as Opportunity | null;
      if (!opp || new Date(opp.ends_at) >= new Date()) return null;
      const hours = (new Date(opp.ends_at).getTime() - new Date(opp.starts_at).getTime()) / 3600000;
      return {
        key: `signup:${row.id}`,
        volunteerId: row.volunteer_id,
        category: opp.category,
        title: opp.title,
        orgName: null,
        orgId: opp.org_id,
        hours: Math.round(hours * 10) / 10,
        happenedAt: opp.ends_at,
        feedAt: opp.ends_at,
      };
    })
    .filter((x): x is FeedItem => x !== null);

  const loggedItems: FeedItem[] = (loggedRows ?? []).map((row) => ({
    key: `manual:${row.id}`,
    volunteerId: row.volunteer_id,
    category: row.category,
    title: row.title,
    orgName: row.org_name,
    orgId: null,
    hours: row.hours,
    happenedAt: row.occurred_at,
    feedAt: row.created_at,
    note: row.note,
  }));

  const combined = [...signupItems, ...loggedItems]
    .sort((a, b) => new Date(b.feedAt).getTime() - new Date(a.feedAt).getTime())
    .slice(0, 50);

  // Resolve org names for signup-derived items (always native, so org_id
  // is always set -- imported listings never get a GoodTogether signup).
  const orgIds = Array.from(new Set(combined.map((i) => i.orgId).filter((id): id is string => !!id)));
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("profiles")
      .select("id, org_name, full_name")
      .in("id", orgIds);
    const orgNamesById: Record<string, string> = {};
    for (const org of orgs ?? []) orgNamesById[org.id] = org.org_name ?? org.full_name;
    for (const item of combined) {
      if (item.orgId) item.orgName = orgNamesById[item.orgId] ?? item.orgName;
    }
  }

  const volunteerIds = Array.from(new Set(combined.map((i) => i.volunteerId)));
  const profilesById: Record<string, { full_name: string; avatar_url: string | null }> = {};
  if (volunteerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", volunteerIds);
    for (const p of profiles ?? []) profilesById[p.id] = p;
  }

  const kudosCountByKey: Record<string, number> = {};
  const givenByMe = new Set<string>();
  const keys = combined.map((i) => i.key);
  if (keys.length > 0) {
    const { data: kudosRows } = await supabase
      .from("activity_kudos")
      .select("activity_key, giver_id")
      .in("activity_key", keys);
    for (const k of kudosRows ?? []) {
      kudosCountByKey[k.activity_key] = (kudosCountByKey[k.activity_key] ?? 0) + 1;
      if (user && k.giver_id === user.id) givenByMe.add(k.activity_key);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Activity feed</h1>
          <p className="mt-1 text-sm text-stone-500">
            Real volunteering from across the GoodTogether community.
          </p>
        </div>
        <Link href="/log" className="btn-primary hidden shrink-0 items-center gap-1.5 sm:inline-flex">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Log activity
        </Link>
      </div>

      <Link href="/log" className="btn-primary mt-4 flex items-center justify-center gap-1.5 sm:hidden">
        <PlusCircle className="h-4 w-4" aria-hidden="true" />
        Log activity
      </Link>

      <p className="mt-3 text-xs text-stone-400">
        Hours are self-reported, not independently verified. Want the ranked view instead?{" "}
        <Link href="/leaderboard" className="text-brand-700 hover:underline">
          See the leaderboard
        </Link>
        .
      </p>

      {combined.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-stone-500">
          No activity yet. Sign up for an opportunity or{" "}
          <Link href="/log" className="text-brand-700 hover:underline">
            log one
          </Link>{" "}
          to get the feed started.
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {combined.map((item) => {
            const profile = profilesById[item.volunteerId];
            const Icon = CATEGORY_ICONS[item.category];
            return (
              <li key={item.key} className="card p-5">
                <div className="flex items-start gap-3">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunset-100 text-sm font-semibold text-sunset-700">
                      {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-700">
                      <span className="font-semibold text-stone-900">
                        {profile?.full_name ?? "Someone"}
                      </span>{" "}
                      logged{" "}
                      <span className="font-medium">
                        {item.hours} hr{item.hours === 1 ? "" : "s"}
                      </span>{" "}
                      of volunteering
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {item.title}
                      {item.orgName && <span> &middot; {item.orgName}</span>}
                    </p>
                    {item.note && (
                      <p className="mt-1 text-sm italic text-stone-500">&ldquo;{item.note}&rdquo;</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="text-xs text-stone-400">{formatRelativeTime(item.feedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <KudosButton
                    activityKey={item.key}
                    initialCount={kudosCountByKey[item.key] ?? 0}
                    initialGiven={givenByMe.has(item.key)}
                    isLoggedIn={!!user}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
