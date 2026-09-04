"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OpportunityCategory } from "@/types/database";

export interface OpportunityFormState {
  error: string | null;
}

function parseFormData(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "") as OpportunityCategory;
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const spotsTotal = Number(formData.get("spots_total"));

  if (!title || !description || !category || !neighborhood || !startsAt || !endsAt) {
    return { error: "Please fill in all required fields." } as const;
  }
  if (!Number.isFinite(spotsTotal) || spotsTotal < 1) {
    return { error: "Spots must be a positive number." } as const;
  }
  if (new Date(endsAt) <= new Date(startsAt)) {
    return { error: "End time must be after the start time." } as const;
  }

  return {
    error: null,
    values: {
      title,
      description,
      category,
      neighborhood,
      address: address || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      spots_total: spotsTotal,
    },
  } as const;
}

export async function createOpportunity(
  _prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in as an organization." };

  const parsed = parseFormData(formData);
  if (parsed.error) return { error: parsed.error };

  const { data: opp, error } = await supabase
    .from("opportunities")
    .insert({ ...parsed.values, org_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  redirect(`/opportunities/${opp.id}`);
}

export async function updateOpportunity(
  opportunityId: string,
  _prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const parsed = parseFormData(formData);
  if (parsed.error) return { error: parsed.error };

  const { error } = await supabase
    .from("opportunities")
    .update(parsed.values)
    .eq("id", opportunityId)
    .eq("org_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/opportunities/${opportunityId}`);
  redirect(`/opportunities/${opportunityId}`);
}

export async function deleteOpportunity(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", opportunityId)
    .eq("org_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
  return { error: null };
}
