import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { BadgeGrid } from "@/components/badge-grid";
import { ProfileBanner } from "@/components/profile-banner";
import { SceneryBackdrop } from "@/components/scenery-backdrop";
import { getVolunteerStats } from "@/lib/volunteer-stats";
import { getCategoryBadges, getMilestoneBadges, getWeeklyBadge } from "@/lib/badges";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const isVolunteer = profile.role === "volunteer";
  const stats = isVolunteer ? await getVolunteerStats(supabase, user.id) : null;
  const earnedBadges = stats
    ? [...getMilestoneBadges(stats), getWeeklyBadge(stats), ...getCategoryBadges(stats)].filter(
        (b) => b.earned
      )
    : [];

  return (
    <div className="relative">
      <SceneryBackdrop variant="profile" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Your profile</h1>
      <div className="card mt-4 overflow-hidden">
        <ProfileBanner badges={earnedBadges} heightClass="h-28" />
        <div className="-mt-12 px-6 pb-6">
          <ProfileForm profile={profile} />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-stone-500">
        {profile.role === "org"
          ? "This shows up on your public organization page \u{1F3E2}"
          : "Orgs can see your name and neighborhood when you sign up \u{1F44B}"}
      </p>

      {isVolunteer && (
        <div className="card mt-6 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-stone-900">Your badges</h2>
            <Link href="/dashboard" className="text-sm font-medium text-brand-700 hover:underline">
              See full progress &rarr;
            </Link>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Self-reported based on opportunity sign-ups, not independently verified.
          </p>
          {earnedBadges.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              Sign up for an opportunity and log your first hours to start earning badges.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-stone-500">
                {earnedBadges.length} badge{earnedBadges.length === 1 ? "" : "s"} earned
              </p>
              <div className="mt-4">
                <BadgeGrid title="Earned" badges={earnedBadges} />
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
