import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOpportunity } from "@/lib/actions/opportunities";
import { OpportunityForm } from "@/components/opportunity-form";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (!opportunity) notFound();
  if (opportunity.org_id !== user.id) redirect("/dashboard");

  const boundAction = updateOpportunity.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Edit opportunity</h1>
      <div className="mt-6">
        <OpportunityForm
          action={boundAction}
          defaultValues={opportunity}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
