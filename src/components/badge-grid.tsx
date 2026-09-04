import type { Badge } from "@/lib/badges";

export function BadgeGrid({ title, badges }: { title: string; badges: Badge[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h3>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={`card flex flex-col items-center gap-1 p-3 text-center transition ${
              badge.earned ? "border-brand-300 bg-brand-50" : "opacity-50 grayscale"
            }`}
          >
            <span className="text-3xl">{badge.emoji}</span>
            <span className="text-xs font-medium text-stone-800">{badge.label}</span>
            {!badge.earned && (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{ width: `${(badge.current / badge.target) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
