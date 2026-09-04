"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signUpForOpportunity(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in as a volunteer to sign up." };
  }

  const { error } = await supabase
    .from("signups")
    .insert({ opportunity_id: opportunityId, volunteer_id: user.id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function cancelSignup(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { error } = await supabase
    .from("signups")
    .delete()
    .eq("opportunity_id", opportunityId)
    .eq("volunteer_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/dashboard");
  return { error: null };
}
