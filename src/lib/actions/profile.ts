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

  if (!fullName) return { error: "Name is required." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      org_name: orgName || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}
