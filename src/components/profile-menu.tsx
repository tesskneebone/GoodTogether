"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ProfileMenuProps {
  avatarUrl: string | null;
  fullName: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  signOutAction: () => Promise<void>;
}

export function ProfileMenu({ avatarUrl, fullName, isAdmin, isLoggedIn, signOutAction }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="flex h-11 items-center justify-center rounded-full px-4 font-label-md text-label-md font-semibold text-primary hover:bg-surface-container/60 transition-colors"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Profile"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-container/60 transition-colors"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-fixed text-xs font-bold text-on-secondary-fixed-variant">
            {fullName?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-44 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-1 shadow-lg"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
          >
            Profile
          </Link>
          <Link
            href="/people"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
          >
            Find people
          </Link>
          {isAdmin && (
            <Link
              href="/admin/organizations"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
            >
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
