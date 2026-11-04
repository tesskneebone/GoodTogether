import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { OpportunityCard } from "@/components/opportunity-card";

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
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-8">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xl">
              🔍
            </span>
            <h2 className="mt-4 text-xl font-semibold text-stone-900">For volunteers</h2>
            <p className="mt-1 text-sm text-stone-500">
              Find a cause that fits your schedule and your neighborhood.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              <li className="flex gap-2">
                <span className="text-brand-600">&#10003;</span>
                Search and filter by cause, date, and LA neighborhood
              </li>
              <li className="flex gap-2">
                <span className="text-brand-600">&#10003;</span>
                Browse opportunities on an interactive map
              </li>
              <li className="flex gap-2">
                <span className="text-brand-600">&#10003;</span>
                Track your volunteer hours automatically
              </li>
              <li className="flex gap-2">
                <span className="text-brand-600">&#10003;</span>
                Earn badges and climb the leaderboard
              </li>
            </ul>
            <Link href="/opportunities" className="btn-primary mt-6 inline-flex">
              Browse Opportunities
            </Link>
          </div>

          <div className="card p-8">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sunset-100 text-xl">
              📋
            </span>
            <h2 className="mt-4 text-xl font-semibold text-stone-900">For organizations</h2>
            <p className="mt-1 text-sm text-stone-500">
              Post an opportunity and reach volunteers actively looking in LA.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              <li className="flex gap-2">
                <span className="text-sunset-600">&#10003;</span>
                Post an opportunity in under two minutes
              </li>
              <li className="flex gap-2">
                <span className="text-sunset-600">&#10003;</span>
                Get a public page listing everything you&apos;ve posted
              </li>
              <li className="flex gap-2">
                <span className="text-sunset-600">&#10003;</span>
                Manage signups and capacity from one dashboard
              </li>
              <li className="flex gap-2">
                <span className="text-sunset-600">&#10003;</span>
                No cost to post, ever
              </li>
            </ul>
            <Link href="/signup" className="btn-secondary mt-6 inline-flex">
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
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
