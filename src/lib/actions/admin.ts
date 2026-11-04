"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { supabase, isAdmin: !!profile?.is_admin };
}

export async function approveOrganization(profileId: string): Promise<{ error: string | null }> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const { error } = await supabase
    .from("profiles")
    .update({ org_status: "approved" })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/admin/organizations");
  return { error: null };
}

export async function rejectOrganization(profileId: string): Promise<{ error: string | null }> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "Not authorized." };

  const { error } = await supabase
    .from("profiles")
    .update({ org_status: "rejected" })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/admin/organizations");
  return { error: null };
}
