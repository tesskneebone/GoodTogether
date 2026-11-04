import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgApprovalButtons } from "@/components/org-approval-buttons";
import type { OrgStatus } from "@/types/database";

const TABS: { value: OrgStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status: OrgStatus = TABS.some((t) => t.value === rawStatus)
    ? (rawStatus as OrgStatus)
    : "pending";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/dashboard");

  const { data: orgs } = await supabase
    .from("profiles")
    .select("id, org_name, full_name, bio, created_at")
    .eq("role", "org")
    .eq("org_status", status)
    .order("created_at", { ascending: true });

  const emails: Record<string, string | null> = {};
  for (const org of orgs ?? []) {
    const { data } = await supabase.rpc("get_org_contact_email", { target_id: org.id });
    emails[org.id] = data ?? null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">Organization approvals</h1>
      <p className="mt-1 text-sm text-stone-500">
        New organizations can&apos;t post opportunities until you verify they&apos;re a real,
        accredited group and approve them here.
      </p>

      <div className="mt-6 flex gap-2">
        {TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/organizations?status=${tab.value}`}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              status === tab.value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-stone-300 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {!orgs || orgs.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-stone-500">No {status} organizations.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {orgs.map((org) => (
            <div key={org.id} className="card flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-stone-900">{org.org_name}</p>
                <p className="text-sm text-stone-500">
                  Contact: {org.full_name}
                  {emails[org.id] ? ` · ${emails[org.id]}` : ""}
                </p>
                {org.bio && <p className="mt-1 text-sm text-stone-600">{org.bio}</p>}
                <p className="mt-1 text-xs text-stone-400">
                  Signed up {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
              <OrgApprovalButtons profileId={org.id} currentStatus={status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
