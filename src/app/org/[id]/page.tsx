import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";

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
          {opportunities.map((opp) => {
            const spotsLeft = opp.spots_total - opp.spots_filled;
            return (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="card block p-5 transition hover:border-brand-300 hover:shadow-md"
              >
                <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  {CATEGORY_LABELS[opp.category]}
                </span>
                <h3 className="mt-3 font-semibold text-stone-900">{opp.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{opp.neighborhood}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {new Date(opp.starts_at).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p
                  className={`mt-2 text-sm font-medium ${
                    spotsLeft <= 0 ? "text-red-600" : "text-brand-700"
                  }`}
                >
                  {spotsLeft <= 0
                    ? "Full"
                    : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
