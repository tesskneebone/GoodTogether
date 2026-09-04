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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Your profile</h1>
      <div className="card mt-4 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-400 via-sunset-300 to-sky-300" />
        <div className="-mt-12 px-6 pb-6">
          <ProfileForm profile={profile} />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-stone-500">
        {profile.role === "org"
          ? "This shows up on your public organization page \u{1F3E2}"
          : "Orgs can see your name and neighborhood when you sign up \u{1F44B}"}
      </p>
    </div>
  );
}
