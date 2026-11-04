"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
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
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
        given
          ? "border-sunset-300 bg-sunset-50 text-sunset-700"
          : "border-stone-200 text-stone-500 hover:border-sunset-200 hover:text-sunset-600"
      } ${!isLoggedIn ? "cursor-default opacity-60" : ""}`}
    >
      <Heart className={`h-4 w-4 ${given ? "fill-sunset-500 text-sunset-500" : ""}`} aria-hidden="true" />
      {count > 0 ? count : "Kudos"}
    </button>
  );
}
