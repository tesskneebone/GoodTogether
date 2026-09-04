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
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
