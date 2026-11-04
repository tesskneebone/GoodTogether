import type { OpportunityCategory } from "@/types/database";

// Unsplash requires attributing the photographer and Unsplash itself,
// with their profile/site links tagged for their own analytics.
// https://help.unsplash.com/en/articles/2511315-guideline-attribution
const UTM = "utm_source=goodtogether-la&utm_medium=referral";

const CATEGORY_SEARCH_TERMS: Record<OpportunityCategory, string> = {
  environment: "beach cleanup volunteers",
  education: "volunteer tutoring students",
  food_security: "food bank volunteers",
  homelessness: "homeless shelter volunteers",
  animal_welfare: "animal shelter volunteer dog",
  health: "community health volunteers",
  seniors: "senior care volunteer",
  youth: "youth mentoring volunteer",
  disaster_relief: "disaster relief volunteers",
  arts_culture: "community art mural volunteers",
  other: "volunteers teamwork outdoors",
};

export interface CategoryPhoto {
  url: string;
  credit: string;
  creditUrl: string;
}

interface UnsplashPhoto {
  urls: { regular: string };
  user: { name: string; links: { html: string } };
  links: { html: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

/**
 * Looks up a representative photo for an opportunity category via the
 * Unsplash API. Returns null (never throws) if no API key is configured
 * or the request fails, so a missing key degrades gracefully rather than
 * breaking imports.
 */
export async function getCategoryPhoto(
  category: OpportunityCategory,
  keywordHint?: string
): Promise<CategoryPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  if (keywordHint?.trim()) {
    const hinted = await searchUnsplash(accessKey, keywordHint.trim());
    if (hinted) return hinted;
  }

  return searchUnsplash(accessKey, CATEGORY_SEARCH_TERMS[category]);
}

async function searchUnsplash(
  accessKey: string,
  query: string
): Promise<CategoryPhoto | null> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=1&orientation=landscape&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
      }
    );

    if (!res.ok) return null;

    const data: UnsplashSearchResponse = await res.json();
    const photo = data.results[0];
    if (!photo) return null;

    return {
      url: photo.urls.regular,
      credit: photo.user.name,
      creditUrl: `${photo.user.links.html}?${UTM}`,
    };
  } catch {
    return null;
  }
}
