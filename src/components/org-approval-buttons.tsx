"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveOrganization, rejectOrganization } from "@/lib/actions/admin";
import type { OrgStatus } from "@/types/database";

export function OrgApprovalButtons({
  profileId,
  currentStatus,
}: {
  profileId: string;
  currentStatus: OrgStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(action: "approve" | "reject") {
    if (
      action === "reject" &&
      currentStatus === "approved" &&
      !confirm(
        "Revoke this organization's approval? They'll immediately lose the ability to post new opportunities. Opportunities they've already posted will stay up."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result =
        action === "approve" ? await approveOrganization(profileId) : await rejectOrganization(profileId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus !== "approved" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handle("approve")}
          className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Approve
        </button>
      )}
      {currentStatus !== "rejected" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handle("reject")}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          {currentStatus === "approved" ? "Revoke approval" : "Reject"}
        </button>
      )}
    </div>
  );
}
