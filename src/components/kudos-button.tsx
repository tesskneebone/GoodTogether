"use client";

import { useState, useTransition } from "react";
import { toggleKudos } from "@/lib/actions/kudos";

export function KudosButton({
  activityKey,
  initialCount,
  initialGiven,
  isLoggedIn,
}: {
  activityKey: string;
  initialCount: number;
  initialGiven: boolean;
  isLoggedIn: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [given, setGiven] = useState(initialGiven);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn || isPending) return;
    const prevGiven = given;
    const nextGiven = !given;
    setGiven(nextGiven);
    setCount((c) => c + (nextGiven ? 1 : -1));

    startTransition(async () => {
      const result = await toggleKudos(activityKey);
      if (result.error) {
        setGiven(prevGiven);
        setCount((c) => c - (nextGiven ? 1 : -1));
      } else if (result.given !== nextGiven) {
        setGiven(result.given);
        setCount((c) => c + (result.given ? 1 : -1) - (nextGiven ? 1 : -1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isLoggedIn || isPending}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label-md text-label-md font-bold transition active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 ${
        given
          ? "bg-secondary-container text-on-secondary-container"
          : "bg-surface-container text-on-surface hover:bg-secondary-container/40"
      } ${!isLoggedIn ? "cursor-default opacity-60" : ""}`}
    >
      <span
        className="material-symbols-outlined text-[18px] text-secondary"
        style={given ? { fontVariationSettings: "'FILL' 1" } : undefined}
        aria-hidden="true"
      >
        thumb_up
      </span>
      {count > 0 ? `${count} Kudos` : "Kudos"}
    </button>
  );
}
