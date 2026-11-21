import { ExpertProfileData, DEFAULT_EXPERT_PROFILE } from "./expertProfile";
import { getExpertId } from "./api";

export interface ExtendedExpertProfileData extends ExpertProfileData {
  phone?: string;
  email?: string;
  formats?: string[];
  lengths?: string[];
  prices?: Record<string, string>;
}

const STORAGE_KEY = "jatayu_expert_profile";

function resolveStorageKey(): string {
  const expertId = getExpertId();
  return expertId ? `jatayu_expert_profile_${expertId}` : STORAGE_KEY;
}

export function getExpertProfile(): ExtendedExpertProfileData {
  if (typeof window === "undefined") {
    return DEFAULT_EXPERT_PROFILE;
  }
  const key = resolveStorageKey();
  const data =
    sessionStorage.getItem(key) ||
    localStorage.getItem(key) ||
    sessionStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return DEFAULT_EXPERT_PROFILE;
  }
  try {
    const parsed = JSON.parse(data) as ExtendedExpertProfileData;
    return {
      ...DEFAULT_EXPERT_PROFILE,
      ...parsed,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    };
  } catch {
    return DEFAULT_EXPERT_PROFILE;
  }
}

export function saveExpertProfile(profile: Partial<ExtendedExpertProfileData>): void {
  if (typeof window === "undefined") return;
  const current = getExpertProfile();
  const updated = { ...current, ...profile };
  const serialized = JSON.stringify(updated);
  const key = resolveStorageKey();
  sessionStorage.setItem(key, serialized);
  localStorage.setItem(key, serialized);
  sessionStorage.setItem(STORAGE_KEY, serialized);
  localStorage.setItem(STORAGE_KEY, serialized);
}

export function clearExpertProfile(): void {
  if (typeof window === "undefined") return;
  const key = resolveStorageKey();
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  const cacheKey = resolveDashboardCacheKey();
  sessionStorage.removeItem(cacheKey);
  localStorage.removeItem(cacheKey);
  sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
  localStorage.removeItem(DASHBOARD_CACHE_KEY);
}

export type CachedExpertDashboardProfile = {
  profile: ExpertProfileData;
  reviewStatus: string;
  reviewerNote: string | null;
  submittedAt: string | null;
  completion: {
    percentage: number;
    checklist: Array<{ id: string; label: string; status: "done" | "pending" }>;
  };
  cachedAt: number;
};

const DASHBOARD_CACHE_KEY = "jatayu_expert_dashboard_cache";

function resolveDashboardCacheKey(): string {
  const expertId = getExpertId();
  return expertId ? `jatayu_expert_dashboard_cache_${expertId}` : DASHBOARD_CACHE_KEY;
}

export function saveExpertDashboardProfileCache(
  data: Omit<CachedExpertDashboardProfile, "cachedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: CachedExpertDashboardProfile = {
    ...data,
    cachedAt: Date.now(),
  };
  const serialized = JSON.stringify(payload);
  const key = resolveDashboardCacheKey();
  sessionStorage.setItem(key, serialized);
  localStorage.setItem(key, serialized);
}

export function getExpertDashboardProfileCache(): CachedExpertDashboardProfile | null {
  if (typeof window === "undefined") return null;
  const key = resolveDashboardCacheKey();
  const data =
    sessionStorage.getItem(key) ||
    localStorage.getItem(key) ||
    sessionStorage.getItem(DASHBOARD_CACHE_KEY) ||
    localStorage.getItem(DASHBOARD_CACHE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as CachedExpertDashboardProfile;
  } catch {
    return null;
  }
}
