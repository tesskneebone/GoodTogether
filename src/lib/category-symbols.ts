import type { OpportunityCategory } from "@/types/database";

/** Material Symbols ligature names for the new design (Feed, Browse). */
export const CATEGORY_SYMBOLS: Record<OpportunityCategory, string> = {
  environment: "forest",
  education: "school",
  food_security: "soup_kitchen",
  homelessness: "home",
  animal_welfare: "pets",
  health: "favorite",
  seniors: "elderly",
  youth: "groups",
  disaster_relief: "emergency",
  arts_culture: "palette",
  other: "star",
};
