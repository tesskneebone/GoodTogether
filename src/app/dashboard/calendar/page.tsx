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

  const [{ data: signups }, { data: loggedActivities }] = await Promise.all([
    supabase
      .from("signups")
      .select("id, opportunities(*)")
      .eq("volunteer_id", user.id)
      .eq("status", "confirmed"),
    supabase
      .from("logged_activities")
      .select("id, title, category, occurred_at")
      .eq("volunteer_id", user.id),
  ]);

  const signupEvents: CalendarEvent[] = (signups ?? [])
    .map((signup): CalendarEvent | null => {
      const opp = (
        Array.isArray(signup.opportunities) ? signup.opportunities[0] : signup.opportunities
      ) as Opportunity | null;
      if (!opp) return null;
      return {
        id: opp.id,
        title: opp.title,
        startsAt: opp.starts_at,
        category: opp.category,
        href: `/opportunities/${opp.id}`,
      };
    })
    .filter((e): e is CalendarEvent => e !== null);

  const loggedEvents: CalendarEvent[] = (loggedActivities ?? []).map((row) => ({
    id: `logged-${row.id}`,
    title: row.title,
    startsAt: row.occurred_at,
    category: row.category,
  }));

  const events: CalendarEvent[] = [...signupEvents, ...loggedEvents];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">My calendar</h1>
        <Link href="/dashboard" className="btn-secondary">
          Back to list
        </Link>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        Everything you&apos;ve signed up for or logged, past and upcoming.
      </p>
      <div className="mt-2 flex gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-200" /> Signed up (click to view)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sunset-200" /> Logged activity
        </span>
      </div>

      <div className="card mt-6 p-4">
        <SignupCalendar events={events} />
      </div>
    </div>
  );
}
