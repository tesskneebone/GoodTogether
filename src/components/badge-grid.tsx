import type { Badge } from "@/lib/badges";

export function BadgeGrid({ title, badges }: { title: string; badges: Badge[] }) {
  return (
    <div>
      <h3 className="font-label-sm text-label-sm uppercase tracking-wide text-outline">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={`flex flex-col items-center gap-1.5 rounded-xl bg-surface-container-lowest p-4 text-center shadow-sm transition ${
              badge.earned ? "ring-2 ring-secondary-fixed" : "opacity-50 grayscale"
            }`}
          >
            {badge.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={badge.icon} alt="" className="h-20 w-20 object-contain" />
            ) : (
              <span className="text-5xl">{badge.emoji}</span>
            )}
            <span className="font-label-sm text-label-sm text-on-surface">{badge.label}</span>
            {!badge.earned && (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-secondary"
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
