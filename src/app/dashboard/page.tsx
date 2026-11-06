import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_SYMBOLS } from "@/lib/category-symbols";
import { DeleteOpportunityButton } from "@/components/delete-opportunity-button";
import { BadgeGrid } from "@/components/badge-grid";
import { OpportunityCardStack } from "@/components/opportunity-card-v2";
import { getVolunteerStats } from "@/lib/volunteer-stats";
import { getCategoryBadges, getMilestoneBadges, getWeeklyBadge } from "@/lib/badges";
import type { Opportunity } from "@/types/database";

export default async function DashboardPage() {
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

  if (profile.role === "org") {
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("*")
      .eq("org_id", user.id)
      .order("starts_at", { ascending: true });

    return (
      <div className="mx-auto max-w-5xl px-margin py-space-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-background">
              {profile.org_name ?? "Your"} opportunities
            </h1>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Manage the volunteer opportunities you&apos;ve posted.
            </p>
          </div>
          {profile.org_status === "approved" && (
            <Link
              href="/dashboard/new"
              className="flex items-center gap-1.5 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-primary flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Post an opportunity
            </Link>
          )}
        </div>

        {profile.org_status !== "approved" && (
          <div className="mt-6 rounded-xl bg-surface-container-lowest p-4 text-sm shadow-sm">
            {profile.org_status === "rejected" ? (
              <p className="text-error">
                Your organization wasn&apos;t approved to post opportunities. If you think this is
                a mistake, reach out to us at{" "}
                <a href="mailto:goodtogetherapp@gmail.com" className="underline">
                  goodtogetherapp@gmail.com
                </a>
                .
              </p>
            ) : (
              <p className="text-tertiary">
                Your organization is pending approval. A GoodTogether admin verifies new
                organizations before they can post opportunities &mdash; we&apos;ll let you know
                once you&apos;re approved.
              </p>
            )}
          </div>
        )}

        {!opportunities || opportunities.length === 0 ? (
          <div className="mt-8 rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-sm">
            You haven&apos;t posted any opportunities yet.
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed-variant">
                    <span className="material-symbols-outlined text-[13px]">
                      {CATEGORY_SYMBOLS[opp.category]}
                    </span>
                    {CATEGORY_LABELS[opp.category]}
                  </span>
                  <p className="mt-1 font-label-lg text-label-lg font-bold text-on-surface truncate">
                    {opp.title}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {new Date(opp.starts_at).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    &middot; {opp.spots_filled}/{opp.spots_total} signed up
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="font-label-md text-label-md font-semibold text-on-surface-variant hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/${opp.id}/edit`}
                    className="font-label-md text-label-md font-semibold text-secondary hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteOpportunityButton opportunityId={opp.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Volunteer dashboard
  const [{ data: signups }, { data: savedOpps }] = await Promise.all([
    supabase
      .from("signups")
      .select("id, opportunity_id, opportunities(*)")
      .eq("volunteer_id", user.id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_opportunities")
      .select("opportunities(*)")
      .eq("volunteer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const stats = await getVolunteerStats(supabase, user.id);
  const milestoneBadges = getMilestoneBadges(stats);
  const categoryBadges = getCategoryBadges(stats);
  const weeklyBadge = getWeeklyBadge(stats);
  const earnedCount =
    milestoneBadges.filter((b) => b.earned).length +
    categoryBadges.filter((b) => b.earned).length +
    (weeklyBadge.earned ? 1 : 0);

  return (
    <div className="mx-auto max-w-5xl px-margin py-space-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-background">My signups</h1>
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

      <div className="mt-6 rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">Your Impact</h2>
          <Link href="/feed" className="font-label-md text-label-md font-semibold text-secondary hover:underline">
            See activity feed &rarr;
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-center sm:flex sm:gap-8 sm:bg-transparent sm:p-0 sm:text-left">
          <div>
            <p className="text-3xl font-bold text-primary">{stats.totalHours}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">hours volunteered</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{stats.completedCount}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">activities completed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{earnedCount}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">badges earned</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <BadgeGrid title="Milestones" badges={milestoneBadges} />
          <BadgeGrid title="This week" badges={[weeklyBadge]} />
          <BadgeGrid title="Causes" badges={categoryBadges} />
        </div>
      </div>

      {!signups || signups.length === 0 ? (
        <div className="mt-8 rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-sm">
          You haven&apos;t signed up for anything yet.{" "}
          <Link href="/opportunities" className="text-secondary hover:underline">
            Browse opportunities
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-10">
          <h2 className="font-headline-sm text-headline-sm text-primary">Signed up elsewhere</h2>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Imported listings you&apos;ve marked as signed up &mdash; once they&apos;re done, they&apos;ll
            count toward your hours.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <p className="mt-10 text-center text-xs text-outline">
        Hours and badges are self-reported based on your sign-ups, imported listings you&apos;ve
        marked as signed up, and logged activities &mdash; not independently verified.
      </p>
    </div>
  );
}
