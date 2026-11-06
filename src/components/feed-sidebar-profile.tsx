import Link from "next/link";

interface Props {
  username: string;
  fullName: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  totalHours: number;
  hoursThisWeek: number;
  completedCount: number;
}

export function FeedSidebarProfile({
  username,
  fullName,
  avatarUrl,
  followerCount,
  followingCount,
  totalHours,
  hoursThisWeek,
  completedCount,
}: Props) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <Link href={`/u/${username}`} className="flex flex-col items-center text-center">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-fixed text-xl font-bold text-on-secondary-fixed-variant">
            {fullName?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
        <span className="mt-2 font-label-lg text-label-lg font-bold text-on-surface">{fullName}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">@{username}</span>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-surface-container-high pt-3 text-center">
        <Link href="/people" className="rounded-lg py-1 hover:bg-surface-container-low">
          <p className="font-label-lg text-label-lg font-bold text-on-surface">{followingCount}</p>
          <p className="text-[11px] text-on-surface-variant">Following</p>
        </Link>
        <Link href="/people" className="rounded-lg py-1 hover:bg-surface-container-low">
          <p className="font-label-lg text-label-lg font-bold text-on-surface">{followerCount}</p>
          <p className="text-[11px] text-on-surface-variant">Followers</p>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-surface-container-low p-2 text-center">
        <div>
          <p className="font-label-lg text-label-lg font-bold text-primary">{totalHours}</p>
          <p className="text-[10px] uppercase tracking-wider text-outline">Hours</p>
        </div>
        <div>
          <p className="font-label-lg text-label-lg font-bold text-primary">{completedCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-outline">Done</p>
        </div>
        <div>
          <p className="font-label-lg text-label-lg font-bold text-primary">{hoursThisWeek}</p>
          <p className="text-[10px] uppercase tracking-wider text-outline">This week</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Link
          href="/log"
          className="flex items-center justify-center gap-1.5 rounded-full bg-primary-container py-2 font-label-md text-label-md font-semibold text-on-primary"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Log activity
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-1.5 rounded-full py-2 font-label-md text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-low"
        >
          See your impact
        </Link>
      </div>
    </div>
  );
}
