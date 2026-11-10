"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { id: "progress", label: "Progress" },
  { id: "impact", label: "Impact" },
  { id: "gallery", label: "Gallery" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProfileTabs({
  progress,
  impact,
  gallery,
}: {
  progress: ReactNode;
  impact: ReactNode;
  gallery: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("progress");
  const content: Record<TabId, ReactNode> = { progress, impact, gallery };

  return (
    <div className="mt-6">
      <div className="flex border-b border-outline-variant">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 border-b-2 pb-3 pt-1 text-center font-label-md text-label-md font-semibold transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{content[tab]}</div>
    </div>
  );
}
