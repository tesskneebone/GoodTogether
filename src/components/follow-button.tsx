"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/lib/actions/follows";

export function FollowButton({
  targetUserId,
  initialFollowing,
  isLoggedIn,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <a href="/login" className="btn-secondary">
        Log in to follow
      </a>
    );
  }

  function handleClick() {
    if (isPending) return;
    const prev = following;
    setFollowing(!prev);
    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      if (result.error) setFollowing(prev);
      else setFollowing(result.following);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={following ? "btn-secondary" : "btn-primary"}
    >
      {following ? (
        <>
          <UserCheck className="mr-1.5 h-4 w-4" aria-hidden="true" /> Following
        </>
      ) : (
        <>
          <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Follow
        </>
      )}
    </button>
  );
}
