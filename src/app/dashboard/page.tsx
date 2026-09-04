import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { DeleteOpportunityButton } from "@/components/delete-opportunity-button";
import type { Opportunity } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "org") {
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("*")
      .eq("org_id", user.id)
      .order("starts_at", { ascending: true });

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">
              {profile.org_name ?? "Your"} opportunities
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Manage the volunteer opportunities you&apos;ve posted.
            </p>
          </div>
          <Link href="/dashboard/new" className="btn-primary">
            Post an opportunity
          </Link>
        </div>

        {!opportunities || opportunities.length === 0 ? (
          <div className="card mt-8 p-8 text-center text-stone-500">
            You haven&apos;t posted any opportunities yet.
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {opportunities.map((opp) => (
              <div key={opp.id} className="card flex items-center justify-between p-4">
                <div>
                  <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {CATEGORY_LABELS[opp.category]}
                  </span>
                  <p className="mt-1 font-medium text-stone-900">{opp.title}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(opp.starts_at).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    &middot; {opp.spots_filled}/{opp.spots_total} signed up
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="text-sm font-medium text-stone-600 hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/${opp.id}/edit`}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteOpportunityButton opportunityId={opp.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Volunteer dashboard
  const { data: signups } = await supabase
    .from("signups")
    .select("id, opportunity_id, opportunities(*)")
    .eq("volunteer_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">My signups</h1>
      <p className="mt-1 text-sm text-stone-500">
        Opportunities you&apos;ve volunteered for.
      </p>

      {!signups || signups.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-stone-500">
          You haven&apos;t signed up for anything yet.{" "}
          <Link href="/opportunities" className="text-brand-700 hover:underline">
            Browse opportunities
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signups.map((signup) => {
            const opp = (
              Array.isArray(signup.opportunities)
                ? signup.opportunities[0]
                : signup.opportunities
            ) as Opportunity | null;
            if (!opp) return null;
            return (
              <Link
                key={signup.id}
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
