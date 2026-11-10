import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { BadgeGrid } from "@/components/badge-grid";
import { ProfileBanner } from "@/components/profile-banner";
import { ImpactChart } from "@/components/impact-chart";
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
    <div className="mx-auto max-w-2xl px-margin py-space-lg">
      <h1 className="font-headline-md text-headline-md text-on-background">Your profile</h1>

      <div className="mt-4 overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <ProfileBanner badges={earnedBadges} heightClass="h-28" />
        <div className="-mt-12 px-6 pb-6">
          <ProfileForm profile={profile} />
        </div>
      </div>

      <p className="mt-4 text-center font-body-sm text-body-sm text-on-surface-variant">
        {profile.role === "org"
          ? "This shows up on your public organization page \u{1F3E2}"
          : "Orgs can see your name and neighborhood when you sign up \u{1F44B}"}
      </p>

      {isVolunteer && stats && (
        <div className="mt-6 rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-primary">Your impact</h2>
          <p className="mt-1 text-xs text-outline">
            Self-reported based on opportunity sign-ups and logged activities, not independently
            verified.
          </p>

          <div className="mt-4 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.hoursThisWeek}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">hours this week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.completedThisWeek}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                activit{stats.completedThisWeek === 1 ? "y" : "ies"} this week
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-label-md text-label-md font-semibold text-on-surface-variant">
              Past 12 weeks
            </p>
            <div className="mt-2">
              <ImpactChart weeks={stats.weeklyHours} />
            </div>
          </div>

          <Link
            href="/dashboard"
            className="mt-4 flex items-center justify-center rounded-full bg-surface-container-low px-4 py-2.5 font-label-md text-label-md font-semibold text-on-surface"
          >
            See more of your progress
          </Link>
        </div>
      )}

      {isVolunteer && (
        <div className="mt-6 rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">Your badges</h2>
            <Link href="/dashboard" className="font-label-md text-label-md font-semibold text-secondary hover:underline">
              See full progress &rarr;
            </Link>
          </div>
          <p className="mt-1 text-xs text-outline">
            Self-reported based on opportunity sign-ups, not independently verified.
          </p>
          {earnedBadges.length === 0 ? (
            <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">
              Sign up for an opportunity and log your first hours to start earning badges.
            </p>
          ) : (
            <>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
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
  );
}
