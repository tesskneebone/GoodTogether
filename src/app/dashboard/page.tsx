import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_SYMBOLS } from "@/lib/category-symbols";
import { DeleteOpportunityButton } from "@/components/delete-opportunity-button";

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

  if (profile.role !== "org") {
    // Volunteer stats, badges, and signups now live on the profile page.
    redirect("/profile");
  }

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("org_id", user.id)
    .order("starts_at", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl px-margin py-space-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-background">
            {profile.org_name ?? "Your"} opportunities
          </h1>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Manage the volunteer opportunities you&apos;ve posted.
          </p>
        </div>
        {profile.org_status === "approved" && (
          <Link
            href="/dashboard/new"
            className="flex items-center gap-1.5 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-primary flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Post an opportunity
          </Link>
        )}
      </div>

      {profile.org_status !== "approved" && (
        <div className="mt-6 rounded-xl bg-surface-container-lowest p-4 text-sm shadow-sm">
          {profile.org_status === "rejected" ? (
            <p className="text-error">
              Your organization wasn&apos;t approved to post opportunities. If you think this is
              a mistake, reach out to us at{" "}
              <a href="mailto:goodtogetherapp@gmail.com" className="underline">
                goodtogetherapp@gmail.com
              </a>
              .
            </p>
          ) : (
            <p className="text-tertiary">
              Your organization is pending approval. A GoodTogether admin verifies new
              organizations before they can post opportunities &mdash; we&apos;ll let you know
              once you&apos;re approved.
            </p>
          )}
        </div>
      )}

      {!opportunities || opportunities.length === 0 ? (
        <div className="mt-8 rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-sm">
          You haven&apos;t posted any opportunities yet.
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
            >
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed-variant">
                  <span className="material-symbols-outlined text-[13px]">
                    {CATEGORY_SYMBOLS[opp.category]}
                  </span>
                  {CATEGORY_LABELS[opp.category]}
                </span>
                <p className="mt-1 font-label-lg text-label-lg font-bold text-on-surface truncate">
                  {opp.title}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {new Date(opp.starts_at).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  &middot; {opp.spots_filled}/{opp.spots_total} signed up
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <Link
                  href={`/opportunities/${opp.id}`}
                  className="font-label-md text-label-md font-semibold text-on-surface-variant hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/dashboard/${opp.id}/edit`}
                  className="font-label-md text-label-md font-semibold text-secondary hover:underline"
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
