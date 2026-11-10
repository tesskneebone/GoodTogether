import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { BadgeGrid } from "@/components/badge-grid";
import { ProfileBanner } from "@/components/profile-banner";
import { ImpactChart } from "@/components/impact-chart";
import { ProfileTabs } from "@/components/profile-tabs";
import { ProfileGallery, type GalleryPhoto } from "@/components/profile-gallery";
import { OpportunityCardStack } from "@/components/opportunity-card-v2";
import { ProfileSignedOutPreview } from "@/components/profile-signed-out-preview";
import { getVolunteerStats } from "@/lib/volunteer-stats";
import { getCategoryBadges, getMilestoneBadges, getWeeklyBadge } from "@/lib/badges";
import type { Opportunity } from "@/types/database";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <ProfileSignedOutPreview />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const isVolunteer = profile.role === "volunteer";
  const stats = isVolunteer ? await getVolunteerStats(supabase, user.id) : null;

  const milestoneBadges = stats ? getMilestoneBadges(stats) : [];
  const categoryBadges = stats ? getCategoryBadges(stats) : [];
  const weeklyBadge = stats ? getWeeklyBadge(stats) : null;
  const earnedCount =
    milestoneBadges.filter((b) => b.earned).length +
    categoryBadges.filter((b) => b.earned).length +
    (weeklyBadge?.earned ? 1 : 0);

  const [{ data: signups }, { data: savedOpps }, { data: loggedActivities }] = isVolunteer
    ? await Promise.all([
        supabase
          .from("signups")
          .select("id, opportunity_id, photo_url, opportunities(*)")
          .eq("volunteer_id", user.id)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_opportunities")
          .select("photo_url, opportunities(*)")
          .eq("volunteer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("logged_activities")
          .select("id, title, photo_url")
          .eq("volunteer_id", user.id)
          .order("occurred_at", { ascending: false }),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const galleryPhotos: GalleryPhoto[] = [];
  for (const row of signups ?? []) {
    const opp = (
      Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
    ) as Opportunity | null;
    if (row.photo_url) {
      galleryPhotos.push({ id: `signup-${row.id}`, url: row.photo_url, alt: opp?.title ?? "" });
    }
  }
  for (const row of savedOpps ?? []) {
    const opp = (
      Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
    ) as Opportunity | null;
    if (row.photo_url && opp) {
      galleryPhotos.push({ id: `saved-${opp.id}`, url: row.photo_url, alt: opp.title });
    }
  }
  for (const row of loggedActivities ?? []) {
    if (row.photo_url) {
      galleryPhotos.push({ id: `logged-${row.id}`, url: row.photo_url, alt: row.title });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-margin py-space-lg">
      <h1 className="font-headline-md text-headline-md text-on-background">Your profile</h1>

      <div className="mt-4 overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <ProfileBanner
          badges={[...milestoneBadges, ...categoryBadges, ...(weeklyBadge ? [weeklyBadge] : [])].filter(
            (b) => b.earned
          )}
          heightClass="h-28"
        />
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
        <ProfileTabs
          progress={
            <div className="space-y-6">
              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                <h2 className="font-headline-sm text-headline-sm text-primary">Your impact</h2>
                <p className="mt-1 text-xs text-outline">
                  Self-reported based on opportunity sign-ups and logged activities, not
                  independently verified.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-center sm:flex sm:gap-8 sm:bg-transparent sm:p-0 sm:text-left">
                  <div>
                    <p className="text-3xl font-bold text-primary">{stats.totalHours}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      hours volunteered
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">{stats.completedCount}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      activities completed
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">{earnedCount}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      badges earned
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-8">
                  <p className="font-label-md text-label-md font-semibold text-on-surface-variant">
                    This week:{" "}
                    <span className="text-on-surface">
                      {stats.hoursThisWeek} hr{stats.hoursThisWeek === 1 ? "" : "s"},{" "}
                      {stats.completedThisWeek} activit{stats.completedThisWeek === 1 ? "y" : "ies"}
                    </span>
                  </p>
                </div>

                <div className="mt-4">
                  <p className="font-label-md text-label-md font-semibold text-on-surface-variant">
                    Past 12 weeks
                  </p>
                  <div className="mt-2">
                    <ImpactChart weeks={stats.weeklyHours} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[28px] text-tertiary">
                    local_fire_department
                  </span>
                  <div>
                    <p className="font-label-lg text-label-lg font-bold text-on-surface">
                      {stats.weekStreak === 0
                        ? "No active streak"
                        : `${stats.weekStreak}-week streak`}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {stats.weekStreak > 0
                        ? "Keep it going — volunteer again this week."
                        : "Volunteer this week to start a streak."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
          impact={
            <div className="space-y-8">
              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                <h2 className="font-headline-sm text-headline-sm text-primary">Your badges</h2>
                <div className="mt-6 space-y-6">
                  <BadgeGrid title="Milestones" badges={milestoneBadges} />
                  {weeklyBadge && <BadgeGrid title="This week" badges={[weeklyBadge]} />}
                  <BadgeGrid title="Causes" badges={categoryBadges} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary">My signups</h2>
                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      Opportunities you&apos;ve volunteered for.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href="/log"
                      className="hidden sm:flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-4 py-2 font-label-md text-label-md font-semibold text-on-surface shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      Log activity
                    </Link>
                    <Link
                      href="/dashboard/calendar"
                      className="hidden sm:flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-4 py-2 font-label-md text-label-md font-semibold text-on-surface shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      Calendar
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 sm:hidden">
                  <Link
                    href="/log"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-surface-container-lowest px-4 py-2 font-label-md text-label-md font-semibold text-on-surface shadow-sm"
                  >
                    Log activity
                  </Link>
                  <Link
                    href="/dashboard/calendar"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-surface-container-lowest px-4 py-2 font-label-md text-label-md font-semibold text-on-surface shadow-sm"
                  >
                    Calendar
                  </Link>
                </div>

                {!signups || signups.length === 0 ? (
                  <div className="mt-4 rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-sm">
                    You haven&apos;t signed up for anything yet.{" "}
                    <Link href="/opportunities" className="text-secondary hover:underline">
                      Browse opportunities
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {signups.map((signup) => {
                      const opp = (
                        Array.isArray(signup.opportunities)
                          ? signup.opportunities[0]
                          : signup.opportunities
                      ) as Opportunity | null;
                      if (!opp) return null;
                      return <OpportunityCardStack key={signup.id} opp={opp} />;
                    })}
                  </div>
                )}

                {savedOpps && savedOpps.length > 0 && (
                  <div className="mt-8">
                    <h2 className="font-headline-sm text-headline-sm text-primary">
                      Signed up elsewhere
                    </h2>
                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      Imported listings you&apos;ve marked as signed up &mdash; once they&apos;re
                      done, they&apos;ll count toward your hours.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {savedOpps.map((row) => {
                        const opp = (
                          Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
                        ) as Opportunity | null;
                        if (!opp) return null;
                        return <OpportunityCardStack key={opp.id} opp={opp} />;
                      })}
                    </div>
                  </div>
                )}

                <p className="mt-8 text-center text-xs text-outline">
                  Hours and badges are self-reported based on your sign-ups, imported listings
                  you&apos;ve marked as signed up, and logged activities &mdash; not independently
                  verified.
                </p>
              </div>
            </div>
          }
          gallery={<ProfileGallery photos={galleryPhotos} />}
        />
      )}
    </div>
  );
}
