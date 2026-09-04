import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role: string; full_name: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-brand-700">
          GoodTogether<span className="text-stone-400"> LA</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/opportunities" className="text-stone-700 hover:text-brand-700">
            Browse
          </Link>
          {profile?.role === "org" && (
            <Link href="/dashboard" className="text-stone-700 hover:text-brand-700">
              My Opportunities
            </Link>
          )}
          {profile?.role === "volunteer" && (
            <Link href="/dashboard" className="text-stone-700 hover:text-brand-700">
              My Signups
            </Link>
          )}
          <Link href="/leaderboard" className="text-stone-700 hover:text-brand-700">
            Leaderboard
          </Link>
          {user && (
            <Link href="/profile" className="text-stone-700 hover:text-brand-700">
              Profile
            </Link>
          )}
          {user ? (
            <form action={signOut}>
              <button type="submit" className="btn-secondary">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
