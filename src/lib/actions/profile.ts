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

  if (!fullName) return { error: "Name is required." };

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
      org_name: orgName || null,
      bio: bio || null,
      neighborhood: neighborhood || null,
      avatar_url: avatarUrl || null,
      age,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}
