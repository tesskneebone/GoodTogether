import { Building2, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function CommunityImpact() {
  const supabase = await createClient();

  const [{ count: volunteerCount }, { count: orgCount }, { data: hoursRows }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "volunteer"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "org"),
    supabase.from("volunteer_hours_alltime").select("total_hours"),
  ]);

  const totalHours = (hoursRows ?? []).reduce((sum, row) => sum + (row.total_hours ?? 0), 0);
  const hasMeaningfulStats = (volunteerCount ?? 0) >= 5 || totalHours >= 10;

  if (!hasMeaningfulStats) {
    return (
      <div className="card bg-brand-50 p-8 text-center sm:p-12">
        <p className="text-lg font-semibold text-stone-900">GoodTogether LA is just getting started.</p>
        <p className="mx-auto mt-2 max-w-xl text-stone-600">
          Every opportunity here is real, posted by or pulled directly from real LA
          nonprofits. Be one of the first to sign up, volunteer, or post.
        </p>
      </div>
    );
  }

  const stats = [
    { label: "Volunteer hours logged", value: Math.round(totalHours).toLocaleString(), icon: Clock },
    { label: "Local organizations", value: (orgCount ?? 0).toLocaleString(), icon: Building2 },
    { label: "Community members", value: (volunteerCount ?? 0).toLocaleString(), icon: Users },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="card flex flex-col items-center gap-2 p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-3xl font-bold text-stone-900">{value}</p>
          <p className="text-sm text-stone-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
