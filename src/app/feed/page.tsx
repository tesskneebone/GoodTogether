import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_SYMBOLS } from "@/lib/category-symbols";
import { KudosButton } from "@/components/kudos-button";
import { CommentSection, type CommentItem } from "@/components/comment-section";
import { FeedSidebarProfile } from "@/components/feed-sidebar-profile";
import { FeedSidebarDiscover } from "@/components/feed-sidebar-discover";
import { getVolunteerStats } from "@/lib/volunteer-stats";
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

  // Desktop sidebar data -- own profile card (left) and a couple of real
  // discovery widgets (right): this week's top volunteers, and a few
  // people not already followed. None of it is fetched on mobile-width
  // renders since the sidebars are hidden there, but Server Components
  // can't branch on viewport, so it's always fetched; all of it is cheap.
  let sidebarProfile: {
    username: string;
    fullName: string;
    avatarUrl: string | null;
    followerCount: number;
    followingCount: number;
    totalHours: number;
    hoursThisWeek: number;
    completedCount: number;
  } | null = null;
  let suggestedPeople: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    neighborhood: string | null;
  }[] = [];

  if (user) {
    const [{ data: ownProfile }, { count: followerCount }, { count: followingCount }, { data: followingRowsForSuggestions }] =
      await Promise.all([
        supabase.from("profiles").select("username, full_name, avatar_url").eq("id", user.id).single(),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);

    if (ownProfile) {
      const stats = await getVolunteerStats(supabase, user.id);
      sidebarProfile = {
        username: ownProfile.username,
        fullName: ownProfile.full_name,
        avatarUrl: ownProfile.avatar_url,
        followerCount: followerCount ?? 0,
        followingCount: followingCount ?? 0,
        totalHours: stats.totalHours,
        hoursThisWeek: stats.hoursThisWeek,
        completedCount: stats.completedCount,
      };
    }

    const excludeIds = [user.id, ...(followingRowsForSuggestions ?? []).map((f) => f.following_id)];
    const { data: suggested } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, neighborhood")
      .eq("role", "volunteer")
      .eq("is_private", false)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(4);
    suggestedPeople = suggested ?? [];
  }

  const { data: weeklyLeaderRows } = await supabase
    .from("volunteer_hours_weekly")
    .select("*")
    .gt("total_hours", 0)
    .order("total_hours", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto w-full max-w-[1200px] lg:grid lg:grid-cols-[260px_minmax(0,640px)_260px] lg:justify-center lg:gap-6 lg:px-4 lg:py-6">
      <aside className="hidden lg:sticky lg:top-20 lg:block lg:h-fit">
        {sidebarProfile ? (
          <FeedSidebarProfile {...sidebarProfile} />
        ) : (
          <div className="rounded-xl bg-surface-container-lowest p-space-md text-center shadow-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Log in to track your own impact and see it here.
            </p>
            <Link href="/login" className="mt-3 inline-flex rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-primary">
              Log in
            </Link>
          </div>
        )}
      </aside>

      <div className="flex flex-col w-full pb-8">
      {/* Segmented tabs + search/log actions */}
      <div className="px-margin pt-2 pb-2 bg-surface/90 backdrop-blur-md sticky top-16 z-30 flex items-center justify-between gap-2 border-b border-surface-container-high/60">
        {user ? (
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full text-label-md font-label-md">
            <Link
              href="/feed"
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all duration-150 ${
                !showFollowingOnly
                  ? "text-on-primary bg-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Everyone
            </Link>
            <Link
              href="/feed?scope=following"
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all duration-150 ${
                showFollowingOnly
                  ? "text-on-primary bg-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Following
            </Link>
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1">
          <Link
            href="/people"
            aria-label="Find people"
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </Link>
          <Link
            href="/log"
            aria-label="Log activity"
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
          </Link>
        </div>
      </div>

      <div className="px-margin pt-3 pb-1">
        <h1 className="font-headline-md text-headline-md text-on-background">Activity feed</h1>
        <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
          Real volunteering from across the GoodTogether community &mdash; self-reported, not
          independently verified.{" "}
          <Link href="/leaderboard" className="text-secondary hover:underline">
            See the leaderboard
          </Link>
          .
        </p>
      </div>

      {combined.length === 0 ? (
        <div className="mx-margin mt-6 rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-[0_4px_20px_-2px_rgba(27,77,62,0.06)]">
          {showFollowingOnly
            ? "Nobody you follow has logged anything yet."
            : "No activity yet. Sign up for an opportunity or"}{" "}
          {!showFollowingOnly && (
            <Link href="/log" className="text-secondary hover:underline">
              log one
            </Link>
          )}
          {!showFollowingOnly && " to get the feed started."}
        </div>
      ) : (
        <div className="flex flex-col gap-3 pt-3">
          {combined.map((item) => {
            const profile = profilesById[item.volunteerId];
            const symbol = CATEGORY_SYMBOLS[item.category];
            return (
              <article
                key={item.key}
                className="bg-surface-container-lowest border-y border-surface-container-high/40 pb-3 sm:rounded-xl sm:border sm:shadow-sm"
              >
                <div className="p-space-md pb-2 flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Link href={profile ? `/u/${profile.username}` : "#"} className="flex-shrink-0">
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-sm font-bold text-on-secondary-fixed-variant border border-outline-variant">
                          {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </Link>
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={profile ? `/u/${profile.username}` : "#"}
                        className="font-label-lg text-label-lg font-bold text-on-surface truncate hover:underline"
                      >
                        {profile?.full_name ?? "Someone"}
                      </Link>
                      <div className="flex items-center gap-1 text-[11px] text-outline truncate">
                        <span>{formatRelativeTime(item.feedAt)}</span>
                        {item.location && (
                          <>
                            <span>&bull;</span>
                            <span className="text-on-surface-variant font-medium">{item.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.editHref && (
                    <Link
                      href={item.editHref}
                      aria-label="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-full text-outline hover:bg-surface-container-low flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Link>
                  )}
                </div>

                <div className="px-space-md pb-2">
                  <h2 className="font-headline-sm text-body-lg font-bold text-on-surface tracking-tight leading-snug">
                    {item.title}
                  </h2>
                  {item.orgName && (
                    <p className="font-body-sm text-body-sm text-secondary font-semibold mt-0.5">
                      {item.orgName}
                    </p>
                  )}
                  {item.note && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed italic">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mx-space-md mb-3 py-2 px-3 bg-surface-container-low rounded-lg grid grid-cols-2 gap-1 border border-surface-container-high/40">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-label-sm uppercase tracking-wider text-outline">
                      Hours
                    </span>
                    <span className="text-body-md font-bold text-on-surface leading-tight">
                      {item.hours} hr{item.hours === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-surface-container-high pl-2">
                    <span className="text-[10px] font-label-sm uppercase tracking-wider text-outline">
                      Cause
                    </span>
                    <span className="text-body-md font-bold text-secondary leading-tight flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">{symbol}</span>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </div>
                </div>

                {item.photoUrl && (
                  <div className="relative w-full h-56 bg-surface-container overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="px-space-md pt-2.5 flex items-center justify-between border-t border-surface-container-high/40 mt-2">
                  <KudosButton
                    activityKey={item.key}
                    initialCount={kudosCountByKey[item.key] ?? 0}
                    initialGiven={givenByMe.has(item.key)}
                    isLoggedIn={!!user}
                  />
                </div>
                <div className="px-space-md">
                  <CommentSection
                    activityKey={item.key}
                    initialComments={commentsByKey[item.key] ?? []}
                    currentUserId={user?.id ?? null}
                    currentUserName={currentUserName}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>

      <aside className="hidden lg:sticky lg:top-20 lg:block lg:h-fit">
        <FeedSidebarDiscover weeklyLeaders={weeklyLeaderRows ?? []} suggestedPeople={suggestedPeople} />
      </aside>
    </div>
  );
}
