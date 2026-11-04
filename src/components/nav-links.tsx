"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, User as UserIcon, X } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
}

interface NavProfile {
  role: string;
  full_name: string;
  avatar_url: string | null;
}

export function NavLinks({
  links,
  profile,
  isLoggedIn,
  signOutAction,
}: {
  links: NavLink[];
  profile: NavProfile | null;
  isLoggedIn: boolean;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  const avatar = profile?.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
  ) : (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sunset-100 text-xs font-semibold text-sunset-700">
      {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
    </span>
  );

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm sm:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-2 font-medium transition motion-reduce:transition-none ${
              isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-stone-700 hover:text-brand-700"
            }`}
          >
            {l.label}
          </Link>
        ))}

        {isLoggedIn ? (
          <div className="relative ml-2" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-stone-700 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              {avatar}
              <ChevronDown className={`h-4 w-4 transition motion-reduce:transition-none ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-44 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <UserIcon className="h-4 w-4" /> Profile
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="ml-2 flex items-center gap-2">
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Sign up
            </Link>
          </div>
        )}
      </nav>

      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="rounded-md p-2 text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:hidden"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-stone-200 bg-white px-4 py-3 shadow-sm sm:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2.5 font-medium ${
                  isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-stone-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 font-medium text-stone-700"
                >
                  {avatar} Profile
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left font-medium text-stone-700"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary flex-1 justify-center"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
