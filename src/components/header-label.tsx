"use client";

import { usePathname } from "next/navigation";

const LABELS: { prefix: string; label: string }[] = [
  { prefix: "/opportunities", label: "Browse" },
  { prefix: "/feed", label: "Feed" },
  { prefix: "/dashboard", label: "Impact" },
  { prefix: "/profile", label: "Profile" },
  { prefix: "/u/", label: "Profile" },
  { prefix: "/people", label: "Find people" },
  { prefix: "/leaderboard", label: "Leaderboard" },
  { prefix: "/admin", label: "Admin" },
  { prefix: "/log", label: "Log activity" },
];

export function HeaderLabel() {
  const pathname = usePathname();
  const match = LABELS.find((l) => pathname === l.prefix || pathname.startsWith(l.prefix));
  return (
    <span className="font-label-sm text-label-sm text-on-surface-variant truncate uppercase tracking-wider">
      {match?.label ?? "Los Angeles"}
    </span>
  );
}
