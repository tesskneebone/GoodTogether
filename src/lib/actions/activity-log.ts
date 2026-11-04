"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OpportunityCategory } from "@/types/database";
import { CATEGORIES } from "@/lib/constants";

export async function logActivity(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "volunteer") {
    return { error: "Only volunteer accounts can log activities." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "") as OpportunityCategory;
  const orgName = String(formData.get("org_name") ?? "").trim() || null;
  const occurredAt = String(formData.get("occurred_at") ?? "");
  const hours = Number(formData.get("hours"));
  const note = String(formData.get("note") ?? "").trim() || null;
  const photoUrl = String(formData.get("photo_url") ?? "").trim() || null;

  if (!title) return { error: "Add a title for what you did." };
  if (!CATEGORIES.includes(category)) return { error: "Choose a category." };
  if (!occurredAt) return { error: "Choose a date." };
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    return { error: "Enter a valid number of hours (up to 24)." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const picked = new Date(`${occurredAt}T00:00:00`);
  if (Number.isNaN(picked.getTime())) return { error: "That date doesn't look right." };
  const diffDays = (today.getTime() - picked.getTime()) / 86_400_000;
  if (diffDays < 0) return { error: "That date is in the future." };
  if (diffDays > 31) return { error: "You can only log activities from the past month." };

  const { error } = await supabase.from("logged_activities").insert({
    volunteer_id: user.id,
    category,
    title,
    org_name: orgName,
    occurred_at: occurredAt,
    hours,
    note,
    photo_url: photoUrl,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/feed");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { error: null };
}
