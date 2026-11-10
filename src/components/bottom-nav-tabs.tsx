"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavTab {
  href: string;
  label: string;
  icon: string;
}

export function BottomNavTabs({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[1100] pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(27,77,62,0.06)]">
      <div className="flex justify-around items-center h-20 px-space-xs">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-space-xs min-w-[56px] h-14 px-space-xs rounded-full font-label-md text-label-md transition-all duration-200 ${
                active ? "text-on-primary bg-primary-container" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">{tab.icon}</span>
              <span className="leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
