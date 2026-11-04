"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedOpportunity(
  opportunityId: string
): Promise<{ error: string | null; saved: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in.", saved: false };

  const { data: existing } = await supabase
    .from("saved_opportunities")
    .select("volunteer_id")
    .eq("volunteer_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_opportunities")
      .delete()
      .eq("volunteer_id", user.id)
      .eq("opportunity_id", opportunityId);
    if (error) return { error: error.message, saved: true };
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
    return { error: null, saved: false };
  }

  const { error } = await supabase
    .from("saved_opportunities")
    .insert({ volunteer_id: user.id, opportunity_id: opportunityId });
  if (error) return { error: error.message, saved: false };

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { error: null, saved: true };
}
