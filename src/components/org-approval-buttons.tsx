"use client";

import { useState, useTransition } from "react";
import { approveOrganization, rejectOrganization } from "@/lib/actions/admin";

export function OrgApprovalButtons({ profileId }: { profileId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handle(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const result =
        action === "approve" ? await approveOrganization(profileId) : await rejectOrganization(profileId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(action === "approve" ? "approved" : "rejected");
    });
  }

  if (done) {
    return <p className="whitespace-nowrap text-sm font-medium text-stone-500">Marked {done}</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handle("approve")}
          className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handle("reject")}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
