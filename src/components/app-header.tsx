import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { ProfileMenu } from "@/components/profile-menu";
import { HeaderLabel } from "@/components/header-label";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string; avatar_url: string | null; is_admin: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
        <Link href="/" className="flex items-center gap-space-sm min-w-0">
          <Logo className="h-8 w-8 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight truncate leading-tight">
              GoodTogether
            </span>
            <HeaderLabel />
          </div>
        </Link>
        <ProfileMenu
          avatarUrl={profile?.avatar_url ?? null}
          fullName={profile?.full_name ?? ""}
          isAdmin={!!profile?.is_admin}
          isLoggedIn={!!user}
          signOutAction={signOut}
        />
      </div>
    </header>
  );
}
