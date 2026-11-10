import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OpportunityCategory } from "@/types/database";

export interface WeeklyImpactPoint {
  weekStart: string;
  hours: number;
}

export interface VolunteerStats {
  totalHours: number;
  hoursThisWeek: number;
  completedThisWeek: number;
  hoursByCategory: Partial<Record<OpportunityCategory, number>>;
  completedCount: number;
  /** Hours completed per week, oldest to newest, for the last 12 weeks (including this week). */
  weeklyHours: WeeklyImpactPoint[];
  /** Consecutive recent weeks (including this one) with at least some volunteering. */
  weekStreak: number;
}

const IMPACT_CHART_WEEKS = 12;

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as the start of the week
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function getVolunteerStats(
  supabase: SupabaseClient<Database>,
  volunteerId: string
): Promise<VolunteerStats> {
  // Filtering on ends_at happens in JS below rather than via PostgREST's
  // embedded-resource filter syntax, which nulls out non-matching embeds
  // instead of excluding the parent row.
  const [{ data: signupRows }, { data: loggedRows }, { data: savedRows }] = await Promise.all([
    supabase
      .from("signups")
      .select("hours_override, opportunities(category, starts_at, ends_at)")
      .eq("volunteer_id", volunteerId)
      .eq("status", "confirmed"),
    supabase
      .from("logged_activities")
      .select("category, hours, occurred_at")
      .eq("volunteer_id", volunteerId),
    // A saved imported opportunity represents "I signed up for this (on
    // the source site)" -- once it's over, it counts the same as a
    // native signup.
    supabase
      .from("saved_opportunities")
      .select("hours_override, opportunities(category, starts_at, ends_at)")
      .eq("volunteer_id", volunteerId),
  ]);

  const weekStart = startOfWeek();
  const weekStarts = Array.from({ length: IMPACT_CHART_WEEKS }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - (IMPACT_CHART_WEEKS - 1 - i) * 7);
    return d;
  });
  const weeklyHoursBuckets = new Array(IMPACT_CHART_WEEKS).fill(0) as number[];

  function weekIndexFor(date: Date): number | null {
    if (date < weekStarts[0]) return null;
    for (let i = IMPACT_CHART_WEEKS - 1; i >= 0; i--) {
      if (date >= weekStarts[i]) return i;
    }
    return null;
  }

  let totalHours = 0;
  let hoursThisWeek = 0;
  let completedCount = 0;
  let completedThisWeek = 0;
  const hoursByCategory: Partial<Record<OpportunityCategory, number>> = {};

  type OppSlice = { category: OpportunityCategory; starts_at: string; ends_at: string };

  function addCompletedOpportunity(opp: OppSlice | null, hoursOverride?: number | null) {
    if (!opp || !opp.ends_at || !opp.starts_at) return;
    if (new Date(opp.ends_at) >= new Date()) return;

    const hours =
      hoursOverride ??
      (new Date(opp.ends_at).getTime() - new Date(opp.starts_at).getTime()) / 3600000;
    if (hours <= 0) return;

    totalHours += hours;
    completedCount += 1;
    hoursByCategory[opp.category] = (hoursByCategory[opp.category] ?? 0) + hours;

    const startsAt = new Date(opp.starts_at);
    if (startsAt >= weekStart) {
      hoursThisWeek += hours;
      completedThisWeek += 1;
    }
    const weekIndex = weekIndexFor(startsAt);
    if (weekIndex !== null) weeklyHoursBuckets[weekIndex] += hours;
  }

  for (const row of signupRows ?? []) {
    const opp = (
      Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
    ) as OppSlice | null;
    addCompletedOpportunity(opp, row.hours_override);
  }

  for (const row of savedRows ?? []) {
    const opp = (
      Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
    ) as OppSlice | null;
    addCompletedOpportunity(opp, row.hours_override);
  }

  for (const row of loggedRows ?? []) {
    totalHours += row.hours;
    completedCount += 1;
    hoursByCategory[row.category] = (hoursByCategory[row.category] ?? 0) + row.hours;

    const occurredAt = new Date(row.occurred_at);
    if (occurredAt >= weekStart) {
      hoursThisWeek += row.hours;
      completedThisWeek += 1;
    }
    const weekIndex = weekIndexFor(occurredAt);
    if (weekIndex !== null) weeklyHoursBuckets[weekIndex] += row.hours;
  }

  const weeklyHours: WeeklyImpactPoint[] = weekStarts.map((d, i) => ({
    weekStart: d.toISOString(),
    hours: Math.round(weeklyHoursBuckets[i] * 10) / 10,
  }));

  let weekStreak = 0;
  for (let i = weeklyHoursBuckets.length - 1; i >= 0; i--) {
    if (weeklyHoursBuckets[i] <= 0) break;
    weekStreak += 1;
  }

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    completedThisWeek,
    hoursByCategory,
    completedCount,
    weeklyHours,
    weekStreak,
  };
}
