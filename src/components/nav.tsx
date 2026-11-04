import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role: string; full_name: string; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const links = [
    { href: "/opportunities", label: "Browse" },
    ...(profile?.role === "org" ? [{ href: "/dashboard", label: "My Opportunities" }] : []),
    ...(profile?.role === "volunteer" ? [{ href: "/dashboard", label: "My Volunteering" }] : []),
    { href: "/feed", label: "Feed" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <Logo className="h-9 w-9" />
          GoodTogether<span className="text-stone-400"> LA</span>
        </Link>
        <NavLinks links={links} profile={profile} isLoggedIn={!!user} signOutAction={signOut} />
      </div>
    </header>
  );
}
