import Link from "next/link";
import { BadgeGrid } from "@/components/badge-grid";
import { ImpactChart } from "@/components/impact-chart";
import { getCategoryBadges, getMilestoneBadges, getWeeklyBadge } from "@/lib/badges";
import type { VolunteerStats } from "@/lib/volunteer-stats";

// Illustrative numbers only, run through the real badge/chart logic so the
// preview shows the same earned-vs-locked styling a real profile would.
const SAMPLE_WEEKLY_HOURS = [1, 2, 0, 3, 2, 4, 1, 3, 5, 2, 3, 4];

function getSampleStats(): VolunteerStats {
  const now = new Date();
  const weeklyHours = SAMPLE_WEEKLY_HOURS.map((hours, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (SAMPLE_WEEKLY_HOURS.length - 1 - i) * 7);
    return { weekStart: d.toISOString(), hours };
  });

  return {
    totalHours: 32,
    hoursThisWeek: 4,
    completedThisWeek: 2,
    completedCount: 14,
    hoursByCategory: { environment: 14, animal_welfare: 11, food_security: 4 },
    weeklyHours,
  };
}

export function ProfileSignedOutPreview() {
  const stats = getSampleStats();
  const milestoneBadges = getMilestoneBadges(stats);
  const categoryBadges = getCategoryBadges(stats);
  const weeklyBadge = getWeeklyBadge(stats);
  const earnedCount =
    milestoneBadges.filter((b) => b.earned).length +
    categoryBadges.filter((b) => b.earned).length +
    (weeklyBadge.earned ? 1 : 0);

  return (
    <div className="mx-auto max-w-2xl px-margin py-space-lg">
      <div className="rounded-xl bg-surface-container-lowest p-space-lg text-center shadow-sm">
        <h1 className="font-headline-md text-headline-md text-on-background">
          Track your volunteering. Earn badges.
        </h1>
        <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
          Create a free account to log your hours, follow friends, and watch your impact grow
          &mdash; badges included.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-primary-container px-6 py-3 font-label-lg text-label-lg font-semibold text-on-primary"
          >
            Sign up free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-outline-variant px-6 py-3 font-label-lg text-label-lg font-semibold text-on-surface"
          >
            Sign in
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center font-label-md text-label-md font-semibold uppercase tracking-wide text-outline">
        A peek at your profile
      </p>

      <div className="relative mt-4 rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <span className="absolute right-4 top-4 rounded-full bg-surface-container-low px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
          Example
        </span>

        <h2 className="font-headline-sm text-headline-sm text-primary">Your impact</h2>
        <p className="mt-1 text-xs text-outline">Sample data to show how progress is tracked.</p>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-center sm:flex sm:gap-8 sm:bg-transparent sm:p-0 sm:text-left">
          <div>
            <p className="text-3xl font-bold text-primary">{stats.totalHours}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">hours volunteered</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{stats.completedCount}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              activities completed
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{earnedCount}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">badges earned</p>
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

        <div className="mt-6 space-y-6">
          <BadgeGrid title="Milestones" badges={milestoneBadges} />
          <BadgeGrid title="This week" badges={[weeklyBadge]} />
          <BadgeGrid title="Causes" badges={categoryBadges} />
        </div>
      </div>
    </div>
  );
}
