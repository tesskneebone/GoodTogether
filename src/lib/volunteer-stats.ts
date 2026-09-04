import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OpportunityCategory } from "@/types/database";

export interface VolunteerStats {
  totalHours: number;
  hoursThisWeek: number;
  hoursByCategory: Partial<Record<OpportunityCategory, number>>;
  completedCount: number;
}

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
  const { data } = await supabase
    .from("signups")
    .select("opportunities(category, starts_at, ends_at)")
    .eq("volunteer_id", volunteerId)
    .eq("status", "confirmed");

  const weekStart = startOfWeek();

  let totalHours = 0;
  let hoursThisWeek = 0;
  let completedCount = 0;
  const hoursByCategory: Partial<Record<OpportunityCategory, number>> = {};

  type OppSlice = { category: OpportunityCategory; starts_at: string; ends_at: string };

  for (const row of data ?? []) {
    const opp = (
      Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities
    ) as OppSlice | null;
    if (!opp || !opp.ends_at || !opp.starts_at) continue;
    if (new Date(opp.ends_at) >= new Date()) continue;

    const hours =
      (new Date(opp.ends_at).getTime() - new Date(opp.starts_at).getTime()) / 3600000;
    if (hours <= 0) continue;

    totalHours += hours;
    completedCount += 1;
    hoursByCategory[opp.category] = (hoursByCategory[opp.category] ?? 0) + hours;

    if (new Date(opp.starts_at) >= weekStart) {
      hoursThisWeek += hours;
    }
  }

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    hoursByCategory,
    completedCount,
  };
}
