import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "@/lib/actions/opportunities";
import { OpportunityForm } from "@/components/opportunity-form";

export default async function NewOpportunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "org") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Post an opportunity</h1>
      <p className="mt-1 text-sm text-stone-500">
        Fill in the details below to list a new volunteer opportunity.
      </p>
      <div className="mt-6">
        <OpportunityForm action={createOpportunity} submitLabel="Publish opportunity" />
      </div>
    </div>
  );
}
