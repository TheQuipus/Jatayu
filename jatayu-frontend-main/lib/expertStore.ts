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
  const data = localStorage.getItem(STORAGE_KEY);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearExpertProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
