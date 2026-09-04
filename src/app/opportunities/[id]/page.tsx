import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { SignupButton } from "@/components/signup-button";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: opp } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (!opp) notFound();

  const { data: org } = await supabase
    .from("profiles")
    .select("org_name, full_name")
    .eq("id", opp.org_id)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSignedUp = false;
  let canSignUp = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    canSignUp = profile?.role === "volunteer";

    if (canSignUp) {
      const { data: signup } = await supabase
        .from("signups")
        .select("id")
        .eq("opportunity_id", id)
        .eq("volunteer_id", user.id)
        .maybeSingle();
      isSignedUp = !!signup;
    }
  }

  const spotsLeft = opp.spots_total - opp.spots_filled;
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
        {CATEGORY_LABELS[opp.category]}
      </span>
      <h1 className="mt-3 text-3xl font-bold text-stone-900">{opp.title}</h1>
      <p className="mt-1 text-stone-500">
        Hosted by {org?.org_name ?? org?.full_name ?? "an organization"}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-xs font-medium uppercase text-stone-400">When</p>
          <p className="mt-1 text-sm text-stone-800">
            {dateFormatter.format(new Date(opp.starts_at))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase text-stone-400">Where</p>
          <p className="mt-1 text-sm text-stone-800">
            {opp.address ? `${opp.address}, ` : ""}
            {opp.neighborhood}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">About this opportunity</h2>
        <p className="mt-2 whitespace-pre-wrap text-stone-700">{opp.description}</p>
      </div>

      <div className="card mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          <span className="font-semibold text-stone-900">
            {spotsLeft > 0 ? spotsLeft : 0}
          </span>{" "}
          of {opp.spots_total} spots left
        </p>
        <div className="sm:w-64">
          <SignupButton
            opportunityId={opp.id}
            isSignedUp={isSignedUp}
            isFull={spotsLeft <= 0}
            canSignUp={canSignUp}
            isLoggedIn={!!user}
          />
        </div>
      </div>
    </div>
  );
}
