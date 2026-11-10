import { createClient } from "@/lib/supabase/server";
import { BottomNavTabs, type NavTab } from "@/components/bottom-nav-tabs";

const VOLUNTEER_TABS: NavTab[] = [
  { href: "/opportunities", label: "Browse", icon: "explore" },
  { href: "/feed", label: "Feed", icon: "local_fire_department" },
  { href: "/profile", label: "Profile", icon: "person" },
];

const ORG_TABS: NavTab[] = [
  { href: "/opportunities", label: "Browse", icon: "explore" },
  { href: "/feed", label: "Feed", icon: "local_fire_department" },
  { href: "/dashboard", label: "Dashboard", icon: "eco" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export async function BottomNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOrg = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isOrg = profile?.role === "org";
  }

  return <BottomNavTabs tabs={isOrg ? ORG_TABS : VOLUNTEER_TABS} />;
}
