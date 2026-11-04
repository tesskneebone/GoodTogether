import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FollowButton } from "@/components/follow-button";

interface PersonResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: string;
  org_name: string | null;
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let results: PersonResult[] = [];

  if (query) {
    // Three separate single-column ilike queries, merged in JS, rather
    // than one .or("full_name.ilike...,username.ilike...") -- PostgREST's
    // or() filter treats commas/parens in the raw string as syntax, so
    // interpolating a search box's free text into it directly would let
    // that text restructure the filter instead of just being the value.
    const pattern = `%${query}%`;
    const select = "id, full_name, username, avatar_url, role, org_name";
    const [{ data: byName }, { data: byUsername }, { data: byOrgName }] = await Promise.all([
      supabase.from("profiles").select(select).ilike("full_name", pattern).limit(20),
      supabase.from("profiles").select(select).ilike("username", pattern).limit(20),
      supabase.from("profiles").select(select).ilike("org_name", pattern).limit(20),
    ]);

    const byId = new Map<string, PersonResult>();
    for (const row of [...(byName ?? []), ...(byUsername ?? []), ...(byOrgName ?? [])]) {
      byId.set(row.id, row);
    }
    results = Array.from(byId.values())
      .filter((r) => r.id !== user?.id)
      .slice(0, 30);
  }

  let followingIds = new Set<string>();
  if (user && results.length > 0) {
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in(
        "following_id",
        results.map((r) => r.id)
      );
    followingIds = new Set((followRows ?? []).map((f) => f.following_id));
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Find people</h1>
      <p className="mt-1 text-sm text-stone-500">Search by name or @username.</p>

      <form method="get" className="mt-6">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search name or username..."
          className="input"
          autoFocus
        />
      </form>

      <div className="mt-6 space-y-2">
        {!query ? (
          <p className="text-sm text-stone-400">Start typing to search.</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-stone-400">No one matches &ldquo;{query}&rdquo;.</p>
        ) : (
          results.map((person) => (
            <div key={person.id} className="card flex items-center justify-between gap-3 p-4">
              <Link href={`/u/${person.username}`} className="flex min-w-0 items-center gap-3">
                {person.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.avatar_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunset-100 text-sm font-semibold text-sunset-700">
                    {person.full_name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">
                    {person.org_name ?? person.full_name}
                  </p>
                  <p className="truncate text-sm text-stone-500">@{person.username}</p>
                </div>
              </Link>
              <FollowButton
                targetUserId={person.id}
                initialFollowing={followingIds.has(person.id)}
                isLoggedIn={!!user}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
