import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/constants";
import { Logo } from "@/components/logo";

export default async function Home() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(3);

  return (
    <div>
      <section className="border-b border-stone-200 bg-gradient-to-b from-brand-50 to-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Logo className="mx-auto h-16 w-16" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Volunteer across Los Angeles,
            <br />
            <span className="text-brand-600">together.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
            Find local volunteer opportunities from LA nonprofits and community
            groups, or post one for your organization.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/opportunities" className="btn-primary px-6 py-3 text-base">
              Browse Opportunities
            </Link>
            <Link href="/signup" className="btn-secondary px-6 py-3 text-base">
              Post an Opportunity
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-stone-900">
            Coming up soon
          </h2>
          <Link href="/opportunities" className="text-sm font-medium text-brand-700 hover:underline">
            View all &rarr;
          </Link>
        </div>

        {!opportunities || opportunities.length === 0 ? (
          <div className="card p-8 text-center text-stone-500">
            No upcoming opportunities yet. Be the first to{" "}
            <Link href="/signup" className="text-brand-700 hover:underline">
              post one
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp) => (
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
