import { CATEGORY_LABELS } from "@/lib/constants";
import type { OpportunityCategory } from "@/types/database";
import type { VolunteerStats } from "@/lib/volunteer-stats";

export interface Badge {
  id: string;
  emoji: string;
  /** Illustrated badge art, when we have it -- falls back to the emoji otherwise. */
  icon?: string;
  label: string;
  description: string;
  earned: boolean;
  current: number;
  target: number;
}

const MILESTONES: { hours: number; emoji: string; icon?: string; label: string }[] = [
  { hours: 1, emoji: "\u{1F476}", icon: "/badges/milestone-1hr.png", label: "First Steps" },
  { hours: 5, emoji: "\u{1F525}", icon: "/badges/milestone-5hr.png", label: "Warming Up" },
  { hours: 10, emoji: "\u{1F91D}", icon: "/badges/milestone-10hr.png", label: "Helping Hand" },
  { hours: 25, emoji: "\u{1F3DB}\u{FE0F}", icon: "/badges/milestone-25hr.png", label: "Community Pillar" },
  { hours: 50, emoji: "\u{1F3C5}", label: "Half Century" },
  { hours: 100, emoji: "\u{1F451}", icon: "/badges/milestone-100hr.png", label: "Century Club" },
];

const CATEGORY_BADGES: Record<
  OpportunityCategory,
  { emoji: string; icon?: string; label: string; threshold: number }
> = {
  environment: { emoji: "\u{1F30A}", icon: "/badges/cause-environment.png", label: "Ocean Hero", threshold: 5 },
  education: { emoji: "\u{1F9E0}", icon: "/badges/cause-education.png", label: "Brainiac Buddy", threshold: 5 },
  food_security: { emoji: "\u{1F96B}", label: "Snack Pack Hero", threshold: 5 },
  homelessness: { emoji: "\u{1F3E0}", label: "Shelter Star", threshold: 5 },
  animal_welfare: { emoji: "\u{1F43E}", label: "Furry Friend", threshold: 5 },
  health: { emoji: "\u{1F9E1}", label: "Wellness Warrior", threshold: 5 },
  seniors: { emoji: "\u{1F3B7}", icon: "/badges/cause-seniors.png", label: "Golden Years Guru", threshold: 5 },
  youth: { emoji: "\u{1F3AE}", icon: "/badges/cause-youth.png", label: "Youth Responder", threshold: 5 },
  disaster_relief: { emoji: "\u{26A1}", label: "Rapid Responder", threshold: 5 },
  arts_culture: { emoji: "\u{1F3A8}", icon: "/badges/cause-arts_culture.png", label: "Culture Vulture", threshold: 5 },
  other: { emoji: "\u{2B50}", label: "Jack of All Trades", threshold: 5 },
};

const WEEKLY_TARGET_HOURS = 5;

export function getMilestoneBadges(stats: VolunteerStats): Badge[] {
  return MILESTONES.map((m) => ({
    id: `milestone-${m.hours}`,
    emoji: m.emoji,
    icon: m.icon,
    label: m.label,
    description: `Volunteer ${m.hours}+ hours total`,
    earned: stats.totalHours >= m.hours,
    current: Math.min(stats.totalHours, m.hours),
    target: m.hours,
  }));
}

export function getCategoryBadges(stats: VolunteerStats): Badge[] {
  return (Object.keys(CATEGORY_BADGES) as OpportunityCategory[]).map((category) => {
    const def = CATEGORY_BADGES[category];
    const current = stats.hoursByCategory[category] ?? 0;
    return {
      id: `category-${category}`,
      emoji: def.emoji,
      icon: def.icon,
      label: def.label,
      description: `Volunteer ${def.threshold}+ hours in ${CATEGORY_LABELS[category]}`,
      earned: current >= def.threshold,
      current: Math.min(current, def.threshold),
      target: def.threshold,
    };
  });
}

export function getWeeklyBadge(stats: VolunteerStats): Badge {
  return {
    id: "weekly-warrior",
    emoji: "\u{1F3C3}",
    label: "Weekly Warrior",
    description: `Volunteer ${WEEKLY_TARGET_HOURS}+ hours this week`,
    earned: stats.hoursThisWeek >= WEEKLY_TARGET_HOURS,
    current: Math.min(stats.hoursThisWeek, WEEKLY_TARGET_HOURS),
    target: WEEKLY_TARGET_HOURS,
  };
}

export function getNextMilestone(stats: VolunteerStats): Badge | null {
  const milestones = getMilestoneBadges(stats);
  return milestones.find((b) => !b.earned) ?? null;
}
