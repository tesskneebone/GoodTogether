"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUpForOpportunity, cancelSignup } from "@/lib/actions/signups";

export function SignupButton({
  opportunityId,
  isSignedUp,
  isFull,
  canSignUp,
  isLoggedIn,
}: {
  opportunityId: string;
  isSignedUp: boolean;
  isFull: boolean;
  canSignUp: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = isSignedUp
        ? await cancelSignup(opportunityId)
        : await signUpForOpportunity(opportunityId);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <a href="/login" className="btn-primary w-full text-center">
        Log in to sign up
      </a>
    );
  }

  if (!canSignUp) {
    return (
      <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-center text-sm text-stone-500">
        Only volunteer accounts can sign up.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending || (isFull && !isSignedUp)}
        className={isSignedUp ? "btn-secondary w-full" : "btn-primary w-full"}
      >
        {isPending
          ? "Saving..."
          : isSignedUp
          ? "Cancel my signup"
          : isFull
          ? "Full"
          : "Sign up to volunteer"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
