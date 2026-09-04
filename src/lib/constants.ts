import type { OpportunityCategory } from "@/types/database";

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  environment: "Environment",
  education: "Education",
  food_security: "Food Security",
  homelessness: "Homelessness",
  animal_welfare: "Animal Welfare",
  health: "Health",
  seniors: "Seniors",
  youth: "Youth",
  disaster_relief: "Disaster Relief",
  arts_culture: "Arts & Culture",
  other: "Other",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as OpportunityCategory[];

// Common LA-area neighborhoods/regions volunteers can filter by.
// Orgs can still type any neighborhood name when creating an opportunity.
export const LA_NEIGHBORHOODS = [
  "Downtown LA",
  "Hollywood",
  "Silver Lake",
  "Echo Park",
  "Highland Park",
  "Koreatown",
  "Boyle Heights",
  "South LA",
  "Venice",
  "Santa Monica",
  "Culver City",
  "Mid-City",
  "Pasadena",
  "Long Beach",
  "San Fernando Valley",
  "East LA",
  "Inglewood",
  "West LA",
];
