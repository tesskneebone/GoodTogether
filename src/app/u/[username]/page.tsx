import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BadgeGrid } from "@/components/badge-grid";
import { FollowButton } from "@/components/follow-button";
import { getVolunteerStats } from "@/lib/volunteer-stats";
import { getCategoryBadges, getMilestoneBadges, getWeeklyBadge } from "@/lib/badges";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.id;
  const isPrivateView = profile.is_private && !isOwnProfile;

  const [{ count: followerCount }, { count: followingCount }, isFollowingRow] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    user
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isVolunteer = profile.role === "volunteer";
  const stats = isVolunteer && !isPrivateView ? await getVolunteerStats(supabase, profile.id) : null;
  const earnedBadges = stats
    ? [...getMilestoneBadges(stats), getWeeklyBadge(stats), ...getCategoryBadges(stats)].filter(
        (b) => b.earned
      )
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-400 via-sunset-300 to-sky-300" />
        <div className="-mt-10 px-6 pb-6">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-sunset-300 to-brand-400 text-2xl font-bold text-white shadow-md">
              {profile.full_name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-stone-900">
                {profile.org_name ?? profile.full_name}
              </h1>
              <p className="text-sm text-stone-500">@{profile.username}</p>
            </div>
            {!isOwnProfile && (
              <FollowButton
                targetUserId={profile.id}
                initialFollowing={!!isFollowingRow.data}
                isLoggedIn={!!user}
              />
            )}
          </div>

          {!isPrivateView && (
            <>
              {profile.bio && <p className="mt-3 text-sm text-stone-700">{profile.bio}</p>}
              {profile.neighborhood && (
                <p className="mt-1 text-sm text-stone-500">{profile.neighborhood}</p>
              )}

              <div className="mt-4 flex gap-6 text-sm">
                <span>
                  <span className="font-semibold text-stone-900">{followerCount ?? 0}</span>{" "}
                  <span className="text-stone-500">followers</span>
                </span>
                <span>
                  <span className="font-semibold text-stone-900">{followingCount ?? 0}</span>{" "}
                  <span className="text-stone-500">following</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {isPrivateView && (
        <div className="card mt-6 flex items-center gap-3 p-6 text-stone-500">
          <Lock className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">This account is private.</p>
        </div>
      )}

      {!isPrivateView && isVolunteer && stats && (
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-semibold text-stone-900">Impact</h2>
          <p className="mt-1 text-xs text-stone-400">
            Self-reported, not independently verified.
          </p>
          <div className="mt-3 flex flex-wrap gap-8">
            <div>
              <p className="text-3xl font-bold text-brand-700">{stats.totalHours}</p>
              <p className="text-sm text-stone-500">hours volunteered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-700">{earnedBadges.length}</p>
              <p className="text-sm text-stone-500">badges earned</p>
            </div>
          </div>
          {earnedBadges.length > 0 && (
            <div className="mt-6">
              <BadgeGrid title="Earned" badges={earnedBadges} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
