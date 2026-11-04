import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogActivityForm } from "@/components/log-activity-form";

export default async function EditLoggedActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activity } = await supabase
    .from("logged_activities")
    .select("*")
    .eq("id", id)
    .eq("volunteer_id", user.id)
    .maybeSingle();

  if (!activity) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Edit activity</h1>
      <p className="mt-1 text-xs text-stone-400">Self-reported, not independently verified.</p>
      <div className="card mt-6 p-6">
        <LogActivityForm userId={user.id} existingActivity={activity} />
      </div>
    </div>
  );
}
