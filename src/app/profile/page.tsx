import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
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

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Your profile</h1>
      <p className="mt-1 text-sm text-stone-500">
        {profile.role === "org"
          ? "This shows up on your public organization page."
          : "Used across the app; orgs can see your name when you sign up."}
      </p>
      <div className="mt-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
