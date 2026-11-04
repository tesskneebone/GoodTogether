"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleSavedOpportunity } from "@/lib/actions/saved-opportunities";

export function SaveToCalendarButton({
  opportunityId,
  initialSaved,
  isLoggedIn,
}: {
  opportunityId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <a href="/login" className="btn-secondary text-center sm:w-64">
        Log in to mark as signed up
      </a>
    );
  }

  function handleClick() {
    if (isPending) return;
    const prev = saved;
    setSaved(!prev);
    startTransition(async () => {
      const result = await toggleSavedOpportunity(opportunityId);
      if (result.error) setSaved(prev);
      else setSaved(result.saved);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn-secondary inline-flex items-center justify-center gap-1.5 text-center sm:w-64"
    >
      {saved ? (
        <>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> You&apos;re signed up
        </>
      ) : (
        <>
          <Circle className="h-4 w-4" aria-hidden="true" /> I&apos;m signed up
        </>
      )}
    </button>
  );
}
