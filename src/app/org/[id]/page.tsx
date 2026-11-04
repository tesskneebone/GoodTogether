import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OpportunityCard } from "@/components/opportunity-card";

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "org")
    .single();

  if (!org) notFound();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("org_id", id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-stone-900">{org.org_name ?? org.full_name}</h1>
      {org.bio && <p className="mt-3 max-w-2xl text-stone-600">{org.bio}</p>}

      <h2 className="mt-10 text-xl font-semibold text-stone-900">
        Upcoming opportunities
      </h2>

      {!opportunities || opportunities.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-stone-500">
          No upcoming opportunities posted right now.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
