"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleKudos(activityKey: string): Promise<{ error: string | null; given: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in.", given: false };

  const { data: existing } = await supabase
    .from("activity_kudos")
    .select("id")
    .eq("giver_id", user.id)
    .eq("activity_key", activityKey)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("activity_kudos").delete().eq("id", existing.id);
    if (error) return { error: error.message, given: true };
    revalidatePath("/feed");
    return { error: null, given: false };
  }

  const { error } = await supabase
    .from("activity_kudos")
    .insert({ giver_id: user.id, activity_key: activityKey });
  if (error) return { error: error.message, given: false };

  revalidatePath("/feed");
  return { error: null, given: true };
}
