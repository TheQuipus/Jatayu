import { ExpertProfileData, DEFAULT_EXPERT_PROFILE } from "./expertProfile";

export interface ExtendedExpertProfileData extends ExpertProfileData {
  phone?: string;
  email?: string;
  formats?: string[];
  lengths?: string[];
  prices?: Record<string, string>;
}

const STORAGE_KEY = "jatayu_expert_profile";

export function getExpertProfile(): ExtendedExpertProfileData {
  if (typeof window === "undefined") {
    return DEFAULT_EXPERT_PROFILE;
  }
  const data = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return DEFAULT_EXPERT_PROFILE;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_EXPERT_PROFILE;
  }
}

export function saveExpertProfile(profile: Partial<ExtendedExpertProfileData>): void {
  if (typeof window === "undefined") return;
  const current = getExpertProfile();
  const updated = { ...current, ...profile };
  const serialized = JSON.stringify(updated);
  sessionStorage.setItem(STORAGE_KEY, serialized);
  localStorage.setItem(STORAGE_KEY, serialized);
}

export function clearExpertProfile(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}
