import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupCalendar, type CalendarEvent } from "@/components/signup-calendar";
import type { Opportunity } from "@/types/database";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: signups } = await supabase
    .from("signups")
    .select("id, opportunities(*)")
    .eq("volunteer_id", user.id)
    .eq("status", "confirmed");

  const events: CalendarEvent[] = (signups ?? [])
    .map((signup) => {
      const opp = (
        Array.isArray(signup.opportunities) ? signup.opportunities[0] : signup.opportunities
      ) as Opportunity | null;
      if (!opp) return null;
      return {
        id: opp.id,
        title: opp.title,
        startsAt: opp.starts_at,
        category: opp.category,
      };
    })
    .filter((e): e is CalendarEvent => e !== null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">My calendar</h1>
        <Link href="/dashboard" className="btn-secondary">
          Back to list
        </Link>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        Every opportunity you&apos;ve signed up for, past and upcoming.
      </p>

      <div className="card mt-6 p-4">
        <SignupCalendar events={events} />
      </div>
    </div>
  );
}
