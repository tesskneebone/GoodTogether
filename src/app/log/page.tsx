import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogActivityForm } from "@/components/log-activity-form";

export default async function LogActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "volunteer") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-stone-600">Only volunteer accounts can log activities.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Log an activity</h1>
      <p className="mt-1 text-stone-500">
        Volunteered somewhere that isn&apos;t on GoodTogether, or donated blood? Add it here
        — up to a month back.
      </p>
      <p className="mt-1 text-xs text-stone-400">
        This is self-reported and isn&apos;t independently verified.
      </p>
      <div className="card mt-6 p-6">
        <LogActivityForm />
      </div>
    </div>
  );
}
