"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActivityExtrasKind = "signup" | "saved";

export async function updateActivityExtras(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const kind = String(formData.get("kind") ?? "") as ActivityExtrasKind;
  const id = String(formData.get("id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const photoUrl = String(formData.get("photo_url") ?? "").trim() || null;
  const hoursOverrideRaw = String(formData.get("hours_override") ?? "").trim();

  if (!id) return { error: "Missing entry." };

  let hoursOverride: number | null = null;
  if (hoursOverrideRaw) {
    hoursOverride = Number(hoursOverrideRaw);
    if (!Number.isFinite(hoursOverride) || hoursOverride <= 0 || hoursOverride > 24) {
      return { error: "Enter a valid number of hours (up to 24), or leave it blank." };
    }
  }

  const row = { note, photo_url: photoUrl, hours_override: hoursOverride };

  const { error } =
    kind === "signup"
      ? await supabase.from("signups").update(row).eq("id", id).eq("volunteer_id", user.id)
      : await supabase
          .from("saved_opportunities")
          .update(row)
          .eq("opportunity_id", id)
          .eq("volunteer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { error: null };
}
