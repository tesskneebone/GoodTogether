import type { Badge } from "@/lib/badges";

const MAX_SHOWN = 3;

export function ProfileBanner({ badges, heightClass = "h-24" }: { badges: Badge[]; heightClass?: string }) {
  const shown = badges.slice(0, MAX_SHOWN);
  const extra = badges.length - shown.length;

  return (
    <div className={`relative ${heightClass} bg-gradient-to-r from-brand-400 via-sunset-300 to-sky-300`}>
      {shown.length > 0 && (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {shown.map((badge) => (
            <div
              key={badge.id}
              title={badge.label}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 shadow-md"
            >
              {badge.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badge.icon} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <span className="text-2xl">{badge.emoji}</span>
              )}
            </div>
          ))}
          {extra > 0 && (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-sm font-semibold text-stone-600 shadow-md">
              +{extra}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
