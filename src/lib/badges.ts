import { CATEGORY_LABELS } from "@/lib/constants";
import type { OpportunityCategory } from "@/types/database";
import type { VolunteerStats } from "@/lib/volunteer-stats";

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  description: string;
  earned: boolean;
  current: number;
  target: number;
}

const MILESTONES: { hours: number; emoji: string; label: string }[] = [
  { hours: 1, emoji: "\u{1F476}", label: "First Steps" },
  { hours: 5, emoji: "\u{1F525}", label: "Warming Up" },
  { hours: 10, emoji: "\u{1F91D}", label: "Helping Hand" },
  { hours: 25, emoji: "\u{1F3DB}\u{FE0F}", label: "Community Pillar" },
  { hours: 50, emoji: "\u{1F3C5}", label: "Half Century" },
  { hours: 100, emoji: "\u{1F451}", label: "Century Club" },
];

const CATEGORY_BADGES: Record<
  OpportunityCategory,
  { emoji: string; label: string; threshold: number }
> = {
  environment: { emoji: "\u{1F30A}", label: "Ocean Hero", threshold: 5 },
  education: { emoji: "\u{1F9E0}", label: "Brainiac Buddy", threshold: 5 },
  food_security: { emoji: "\u{1F96B}", label: "Snack Pack Hero", threshold: 5 },
  homelessness: { emoji: "\u{1F3E0}", label: "Shelter Star", threshold: 5 },
  animal_welfare: { emoji: "\u{1F43E}", label: "Furry Friend", threshold: 5 },
  health: { emoji: "\u{1F9E1}", label: "Wellness Warrior", threshold: 5 },
  seniors: { emoji: "\u{1F3B7}", label: "Golden Years Guru", threshold: 5 },
  youth: { emoji: "\u{1F3AE}", label: "Youth Champion", threshold: 5 },
  disaster_relief: { emoji: "\u{26A1}", label: "Rapid Responder", threshold: 5 },
  arts_culture: { emoji: "\u{1F3A8}", label: "Culture Vulture", threshold: 5 },
  other: { emoji: "\u{2B50}", label: "Jack of All Trades", threshold: 5 },
};

const WEEKLY_TARGET_HOURS = 5;

export function getMilestoneBadges(stats: VolunteerStats): Badge[] {
  return MILESTONES.map((m) => ({
    id: `milestone-${m.hours}`,
    emoji: m.emoji,
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
