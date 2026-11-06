"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOpportunity } from "@/lib/actions/opportunities";

export function DeleteOpportunityButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteOpportunity(opportunityId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="font-label-md text-label-md font-semibold text-error hover:underline disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
