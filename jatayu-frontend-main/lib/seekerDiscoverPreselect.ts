import { SEEKER_PREDEFINED_CATEGORIES } from "./seekerCategories";

export const DISCOVER_ABSOLUTE_MIN_PRICE = 0;
export const DISCOVER_ABSOLUTE_MAX_PRICE = 300000;

export const BUDGET_BUCKET_MAX_PRICE: Record<string, number> = {
  budget: 2500,
  standard: 8000,
  premium: 20000,
};

export interface SeekerDiscoverPreselect {
  categories: string[];
  languages: string[];
  priceRange: [number, number];
}

export interface SeekerDiscoverFilterSnapshot {
  selectedTopics: string[];
  selectedLanguages: string[];
  selectedRatings: string[];
  priceRange: [number, number];
  selectedAvailabilities: string[];
  searchQuery: string;
}

export function resolvePredefinedCategoryId(rawCategory?: string): string | null {
  const clean = String(rawCategory || "").trim();
  if (!clean) return null;
  const lower = clean.toLowerCase();
  if (lower === "other-not-sure" || lower === "other" || lower.startsWith("custom-")) {
    return null;
  }
  const match = SEEKER_PREDEFINED_CATEGORIES.find(
    (cat) => cat.id === lower || cat.label.toLowerCase() === lower,
  );
  return match ? match.id : null;
}

export function resolveBudgetPriceRange(selectedBudget?: string): [number, number] {
  const key = String(selectedBudget || "").trim().toLowerCase();
  const maxPrice = BUDGET_BUCKET_MAX_PRICE[key];
  if (typeof maxPrice === "number" && maxPrice < DISCOVER_ABSOLUTE_MAX_PRICE) {
    return [DISCOVER_ABSOLUTE_MIN_PRICE, maxPrice];
  }
  return [DISCOVER_ABSOLUTE_MIN_PRICE, DISCOVER_ABSOLUTE_MAX_PRICE];
}

export function deriveSeekerDiscoverPreselect(
  profile: {
    category?: string;
    selectedLanguages?: string[];
    selectedBudget?: string;
  },
  availableLanguageOptions: readonly string[],
): SeekerDiscoverPreselect {
  const categoryId = resolvePredefinedCategoryId(profile.category);
  const categories = categoryId ? [categoryId] : [];

  const optionByLower = new Map<string, string>();
  for (const opt of availableLanguageOptions) {
    const trimmed = String(opt || "").trim();
    if (trimmed) {
      optionByLower.set(trimmed.toLowerCase(), trimmed);
    }
  }

  const languages: string[] = [];
  for (const lang of profile.selectedLanguages || []) {
    const matched = optionByLower.get(String(lang || "").trim().toLowerCase());
    if (matched && !languages.includes(matched)) {
      languages.push(matched);
    }
  }

  const priceRange = resolveBudgetPriceRange(profile.selectedBudget);

  return {
    categories,
    languages,
    priceRange,
  };
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

export function areFiltersEqualToPreselect(
  current: SeekerDiscoverFilterSnapshot,
  preselect: SeekerDiscoverPreselect,
): boolean {
  return (
    sameStringSet(current.selectedTopics, preselect.categories) &&
    sameStringSet(current.selectedLanguages, preselect.languages) &&
    current.selectedRatings.length === 0 &&
    current.priceRange[0] === preselect.priceRange[0] &&
    current.priceRange[1] === preselect.priceRange[1] &&
    current.selectedAvailabilities.length === 0 &&
    current.searchQuery.trim() === ""
  );
}
