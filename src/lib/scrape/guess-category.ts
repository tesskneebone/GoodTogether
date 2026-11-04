import type { OpportunityCategory } from "@/types/database";

// Keyword hints used to infer a category when a source doesn't publish
// one directly (most RSS feeds and nonprofit listing pages don't).
const KEYWORDS: Record<OpportunityCategory, string[]> = {
  environment: ["beach cleanup", "park cleanup", "tree planting", "environment", "sustainab", "recycl", "garden", "river", "trail"],
  education: ["tutor", "mentor student", "literacy", "classroom", "school supplies", "esl", "reading"],
  food_security: ["food bank", "food pantry", "meal", "soup kitchen", "hunger", "grocery distribut"],
  homelessness: ["homeless", "shelter", "unhoused", "transitional housing"],
  animal_welfare: ["animal shelter", "dog", "cat", "rescue animal", "humane society", "wildlife"],
  health: ["health clinic", "blood drive", "hospital", "medical", "mental health", "wellness"],
  seniors: ["senior", "elderly", "nursing home", "retirement community"],
  youth: ["youth", "after school", "kids program", "children's"],
  disaster_relief: ["disaster", "wildfire relief", "earthquake", "emergency relief", "red cross"],
  arts_culture: ["art", "mural", "museum", "theater", "theatre", "music program", "culture"],
  other: [],
};

export function guessCategory(text: string): OpportunityCategory {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORDS) as [
    OpportunityCategory,
    string[]
  ][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "other";
}
