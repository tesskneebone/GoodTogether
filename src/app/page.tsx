import Link from "next/link";
import { Search, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OpportunityCard } from "@/components/opportunity-card";
import { CategoryGrid } from "@/components/category-grid";
import { CommunityImpact } from "@/components/community-impact";

export default async function Home() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(3);

  const { data: heroPhotoRows } = await supabase
    .from("opportunities")
    .select("image_url, image_credit, image_credit_url")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const heroPhoto = heroPhotoRows?.[0];

  const orgIds = Array.from(
    new Set((opportunities ?? []).map((o) => o.org_id).filter((id): id is string => !!id))
  );
  const orgNamesById: Record<string, string> = {};
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("profiles")
      .select("id, org_name, full_name")
      .in("id", orgIds);
    for (const org of orgs ?? []) {
      orgNamesById[org.id] = org.org_name ?? org.full_name;
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        {heroPhoto?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-brand-100 to-brand-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/55 to-stone-900/80" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:py-32">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Find your people.
            <br />
            Make a difference.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            Discover meaningful ways to give back in Los Angeles.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/opportunities" className="btn-primary px-6 py-3 text-base">
              Explore Opportunities
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-white/70 bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              Post an Opportunity
            </Link>
          </div>
        </div>

        {heroPhoto?.image_credit && (
          <p className="absolute bottom-2 right-3 text-xs text-white/70">
            Photo by{" "}
            {heroPhoto.image_credit_url ? (
              <a href={heroPhoto.image_credit_url} className="hover:underline">
                {heroPhoto.image_credit}
              </a>
            ) : (
              heroPhoto.image_credit
            )}{" "}
            on Unsplash
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-stone-900">Browse by cause</h2>
        <p className="mt-1 text-stone-500">Find the kind of volunteering that fits you.</p>
        <div className="mt-6">
          <CategoryGrid />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-8">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Search className="h-5 w-5" aria-hidden="true" />
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
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sunset-100 text-sunset-700">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
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
          <h2 className="text-2xl font-semibold text-stone-900">Coming up soon</h2>
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
              <OpportunityCard
                key={opp.id}
                opp={opp}
                orgName={opp.org_id ? orgNamesById[opp.org_id] : undefined}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold text-stone-900">Small actions. Big impact.</h2>
        <div className="mt-6">
          <CommunityImpact />
        </div>
      </section>

      <section className="border-t border-stone-200 bg-brand-700">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Make a difference in your community.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">
            Running a nonprofit or community group in LA? Post your volunteer opportunities
            and reach people actively looking to help — free, always.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 transition hover:bg-brand-50"
          >
            Post an Opportunity
          </Link>
        </div>
      </section>
    </div>
  );
}
