"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileFormState {
  error: string | null;
  success?: boolean;
}

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const orgName = String(formData.get("org_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const isPrivate = formData.get("is_private") === "on";
  const hideAge = formData.get("hide_age") === "on";
  const hideBio = formData.get("hide_bio") === "on";

  if (!fullName) return { error: "Name is required." };
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "Username must be 3-20 characters: lowercase letters, numbers, underscores." };
  }

  const { data: usernameTaken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (usernameTaken) return { error: "That username is already taken." };

  let age: number | null = null;
  if (ageRaw) {
    age = Number(ageRaw);
    if (!Number.isInteger(age) || age < 13 || age > 120) {
      return { error: "Age must be a whole number between 13 and 120." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      username,
      org_name: orgName || null,
      bio: bio || null,
      neighborhood: neighborhood || null,
      avatar_url: avatarUrl || null,
      age,
      hide_age: hideAge,
      hide_bio: hideBio,
      is_private: isPrivate,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken." };
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/feed");
  revalidatePath("/leaderboard");
  revalidatePath(`/u/${username}`);
  return { error: null, success: true };
}
