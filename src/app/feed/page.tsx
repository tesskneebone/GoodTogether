import Link from "next/link";
import { PlusCircle, Search, MapPin, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { KudosButton } from "@/components/kudos-button";
import { CommentSection, type CommentItem } from "@/components/comment-section";
import { SceneryBackdrop } from "@/components/scenery-backdrop";
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
  photoUrl?: string | null;
  location?: string | null;
  editHref?: string;
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

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showFollowingOnly = scope === "following" && !!user;

  const [{ data: signupRows }, { data: loggedRows }, { data: savedRows }] = await Promise.all([
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
    // A saved imported opportunity means "I signed up for this on the
    // source site" -- once it's over, it shows in the feed like any
    // other completed activity.
    supabase
      .from("saved_opportunities")
      .select("volunteer_id, created_at, opportunities(*)")
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
        photoUrl: opp.image_url,
      };
    })
    .filter((x): x is FeedItem => x !== null);

  const signedUpImportedItems: FeedItem[] = (savedRows ?? [])
    .map((row): FeedItem | null => {
      const opp = (
        Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
      ) as Opportunity | null;
      if (!opp || new Date(opp.ends_at) >= new Date()) return null;
      const hours = (new Date(opp.ends_at).getTime() - new Date(opp.starts_at).getTime()) / 3600000;
      return {
        key: `saved:${opp.id}`,
        volunteerId: row.volunteer_id,
        category: opp.category,
        title: opp.title,
        orgName: opp.source_name,
        orgId: null,
        hours: Math.round(hours * 10) / 10,
        happenedAt: opp.ends_at,
        feedAt: opp.ends_at,
        photoUrl: opp.image_url,
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
    photoUrl: row.photo_url,
    location: row.location,
    editHref: user && row.volunteer_id === user.id ? `/log/${row.id}` : undefined,
  }));

  let combined = [...signupItems, ...signedUpImportedItems, ...loggedItems].sort(
    (a, b) => new Date(b.feedAt).getTime() - new Date(a.feedAt).getTime()
  );

  if (showFollowingOnly && user) {
    const { data: followingRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = new Set((followingRows ?? []).map((f) => f.following_id));
    followingIds.add(user.id);
    combined = combined.filter((i) => followingIds.has(i.volunteerId));
  }

  // Private accounts' activity is only visible to themselves -- hidden
  // from the feed for everyone else, regardless of follow status.
  const candidateVolunteerIds = Array.from(new Set(combined.map((i) => i.volunteerId)));
  if (candidateVolunteerIds.length > 0) {
    const { data: privacyRows } = await supabase
      .from("profiles")
      .select("id, is_private")
      .in("id", candidateVolunteerIds);
    const privateIds = new Set((privacyRows ?? []).filter((p) => p.is_private).map((p) => p.id));
    combined = combined.filter((i) => !privateIds.has(i.volunteerId) || i.volunteerId === user?.id);
  }

  combined = combined.slice(0, 50);

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

  const keys = combined.map((i) => i.key);

  const { data: commentRows } = keys.length
    ? await supabase
        .from("activity_comments")
        .select("id, activity_key, author_id, body")
        .in("activity_key", keys)
        .order("created_at", { ascending: true })
    : { data: [] };

  const profileIds = Array.from(
    new Set([...combined.map((i) => i.volunteerId), ...(commentRows ?? []).map((c) => c.author_id)])
  );
  const profilesById: Record<string, { full_name: string; username: string; avatar_url: string | null }> = {};
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", profileIds);
    for (const p of profiles ?? []) profilesById[p.id] = p;
  }

  const commentIds = (commentRows ?? []).map((c) => c.id);
  const commentLikeCountById: Record<string, number> = {};
  const commentLikedByMe = new Set<string>();
  if (commentIds.length > 0) {
    const { data: likeRows } = await supabase
      .from("comment_likes")
      .select("comment_id, liker_id")
      .in("comment_id", commentIds);
    for (const l of likeRows ?? []) {
      commentLikeCountById[l.comment_id] = (commentLikeCountById[l.comment_id] ?? 0) + 1;
      if (user && l.liker_id === user.id) commentLikedByMe.add(l.comment_id);
    }
  }

  const commentsByKey: Record<string, CommentItem[]> = {};
  for (const c of commentRows ?? []) {
    (commentsByKey[c.activity_key] ??= []).push({
      id: c.id,
      authorId: c.author_id,
      authorName: profilesById[c.author_id]?.full_name ?? "Someone",
      body: c.body,
      likeCount: commentLikeCountById[c.id] ?? 0,
      likedByMe: commentLikedByMe.has(c.id),
    });
  }

  const kudosCountByKey: Record<string, number> = {};
  const givenByMe = new Set<string>();
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

  const currentUserName = user ? profilesById[user.id]?.full_name ?? null : null;

  return (
    <div className="relative">
      <SceneryBackdrop variant="feed" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Activity feed</h1>
          <p className="mt-1 text-sm text-stone-500">
            Real volunteering from across the GoodTogether community.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link href="/people" className="btn-secondary inline-flex items-center gap-1.5">
            <Search className="h-4 w-4" aria-hidden="true" />
            Find people
          </Link>
          <Link href="/log" className="btn-primary inline-flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Log activity
          </Link>
        </div>
      </div>

      <div className="mt-4 flex gap-2 sm:hidden">
        <Link href="/people" className="btn-secondary flex flex-1 items-center justify-center gap-1.5">
          <Search className="h-4 w-4" aria-hidden="true" />
          Find people
        </Link>
        <Link href="/log" className="btn-primary flex flex-1 items-center justify-center gap-1.5">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Log activity
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {user ? (
          <div className="inline-flex rounded-lg border border-stone-300 bg-white p-1 text-sm">
            <Link
              href="/feed"
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                !showFollowingOnly ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              Everyone
            </Link>
            <Link
              href="/feed?scope=following"
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                showFollowingOnly ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              Following
            </Link>
          </div>
        ) : (
          <span />
        )}
        <p className="text-xs text-stone-400">
          Self-reported, not independently verified.{" "}
          <Link href="/leaderboard" className="text-brand-700 hover:underline">
            See the leaderboard
          </Link>
          .
        </p>
      </div>

      {combined.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-stone-500">
          {showFollowingOnly
            ? "Nobody you follow has logged anything yet."
            : "No activity yet. Sign up for an opportunity or"}{" "}
          {!showFollowingOnly && (
            <Link href="/log" className="text-brand-700 hover:underline">
              log one
            </Link>
          )}
          {!showFollowingOnly && " to get the feed started."}
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {combined.map((item) => {
            const profile = profilesById[item.volunteerId];
            const Icon = CATEGORY_ICONS[item.category];
            return (
              <li key={item.key} className="card p-5">
                <div className="flex items-start gap-3">
                  <Link href={profile ? `/u/${profile.username}` : "#"} className="shrink-0">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sunset-100 text-sm font-semibold text-sunset-700">
                        {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-700">
                      <Link
                        href={profile ? `/u/${profile.username}` : "#"}
                        className="font-semibold text-stone-900 hover:underline"
                      >
                        {profile?.full_name ?? "Someone"}
                      </Link>{" "}
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
                    {item.location && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {item.location}
                      </p>
                    )}
                    {item.note && (
                      <p className="mt-1 text-sm italic text-stone-500">&ldquo;{item.note}&rdquo;</p>
                    )}
                    {item.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoUrl}
                        alt=""
                        className="mt-2 max-h-72 w-full rounded-lg object-cover"
                      />
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="text-xs text-stone-400">{formatRelativeTime(item.feedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  {item.editHref && (
                    <Link
                      href={item.editHref}
                      className="flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1 text-sm font-medium text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </Link>
                  )}
                  <KudosButton
                    activityKey={item.key}
                    initialCount={kudosCountByKey[item.key] ?? 0}
                    initialGiven={givenByMe.has(item.key)}
                    isLoggedIn={!!user}
                  />
                </div>
                <CommentSection
                  activityKey={item.key}
                  initialComments={commentsByKey[item.key] ?? []}
                  currentUserId={user?.id ?? null}
                  currentUserName={currentUserName}
                />
              </li>
            );
          })}
        </ol>
      )}
      </div>
    </div>
  );
}
