import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { SignupButton } from "@/components/signup-button";
import { SaveToCalendarButton } from "@/components/save-to-calendar-button";
import { OpportunityImage } from "@/components/opportunity-image";

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

  const isImported = !!opp.source;

  const { data: org } = opp.org_id
    ? await supabase
        .from("profiles")
        .select("org_name, full_name")
        .eq("id", opp.org_id)
        .single()
    : { data: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSignedUp = false;
  let canSignUp = false;
  let isSaved = false;

  if (user && isImported) {
    const { data: saved } = await supabase
      .from("saved_opportunities")
      .select("volunteer_id")
      .eq("volunteer_id", user.id)
      .eq("opportunity_id", id)
      .maybeSingle();
    isSaved = !!saved;
  }

  if (user && !isImported) {
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
      {opp.image_url && (
        <div className="mb-6 overflow-hidden rounded-xl">
          <OpportunityImage src={opp.image_url} alt="" className="h-64 w-full object-cover" />
          {opp.image_credit && (
            <p className="mt-1 text-right text-xs text-stone-400">
              Photo by{" "}
              {opp.image_credit_url ? (
                <a href={opp.image_credit_url} className="hover:underline">
                  {opp.image_credit}
                </a>
              ) : (
                opp.image_credit
              )}{" "}
              on Unsplash
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {CATEGORY_LABELS[opp.category]}
        </span>
        {isImported && (
          <span className="inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
            Imported listing
          </span>
        )}
      </div>
      <h1 className="mt-3 text-3xl font-bold text-stone-900">{opp.title}</h1>
      <p className="mt-1 text-stone-500">
        {isImported ? (
          opp.source_url ? (
            <>
              Posted via{" "}
              <a href={opp.source_url} className="text-brand-700 hover:underline">
                {opp.source_name ?? "an external source"}
              </a>
            </>
          ) : (
            `Posted via ${opp.source_name ?? "an external source"}`
          )
        ) : (
          <>
            Hosted by{" "}
            <Link href={`/org/${opp.org_id}`} className="text-brand-700 hover:underline">
              {org?.org_name ?? org?.full_name ?? "an organization"}
            </Link>
          </>
        )}
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

      {isImported ? (
        <div className="card mt-8 flex flex-col gap-3 p-5">
          <p className="text-sm text-stone-600">
            Signups for this opportunity happen on {opp.source_name ?? "the original site"}.
            Already signed up there? Mark it here so it shows on your calendar and counts
            toward your hours once it&apos;s done.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {opp.source_url && (
              <a
                href={opp.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center sm:w-64"
              >
                View &amp; sign up on {opp.source_name ?? "source site"}
              </a>
            )}
            <SaveToCalendarButton opportunityId={opp.id} initialSaved={isSaved} isLoggedIn={!!user} />
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
