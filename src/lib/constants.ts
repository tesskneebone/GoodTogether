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

// Approximate centroids for map markers. Neighborhood-level precision only —
// opportunities aren't geocoded to an exact address.
export const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  "Downtown LA": [34.0407, -118.2468],
  Hollywood: [34.0928, -118.3287],
  "Silver Lake": [34.0869, -118.2702],
  "Echo Park": [34.0781, -118.2606],
  "Highland Park": [34.1141, -118.1876],
  Koreatown: [34.0577, -118.3004],
  "Boyle Heights": [34.0327, -118.2087],
  "South LA": [33.985, -118.282],
  Venice: [33.985, -118.4695],
  "Santa Monica": [34.0195, -118.4912],
  "Culver City": [34.0211, -118.3965],
  "Mid-City": [34.0522, -118.3376],
  Pasadena: [34.1478, -118.1445],
  "Long Beach": [33.7701, -118.1937],
  "San Fernando Valley": [34.1808, -118.4423],
  "East LA": [34.0239, -118.1723],
  Inglewood: [33.9617, -118.3531],
  "West LA": [34.0469, -118.4487],
};

export const LA_MAP_CENTER: [number, number] = [34.0522, -118.2437];
