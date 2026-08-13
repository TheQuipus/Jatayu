import { getSeekerProfile } from "@/lib/api";
import { SEEKER_PROFILE } from "@/lib/seekerDashboard";

export type SeekerProfileData = {
  name: string;
  avatar: string;
  category?: string;
  isPro?: boolean;
  email?: string;
  phone?: string;
};

const SEEKER_PROFILE_STORAGE_KEY = "jatayu_seeker_profile";
export const SEEKER_PROFILE_UPDATED_EVENT = "seeker-profile-updated";

type BackendSeekerProfile = {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePhotoSrc?: string;
  avatarUrl?: string;
  avatar?: string;
  category?: string;
  selectedCategory?: string;
  categoryName?: string;
  isPro?: boolean;
};

export function formatCategoryLabel(category?: string): string {
  if (!category || !category.trim()) return "Seeker";

  const catMap: Record<string, string> = {
    "career-work": "Career & Work",
    "legal-compliance": "Legal & Compliance",
    "business-entrepreneurship": "Business & Entrepreneurship",
    "personal-growth": "Personal Growth",
    "finance-investment": "Finance & Investment",
    "software": "Software & Development",
    "design": "Design & Creative",
    "business": "Business",
    "marketing": "Marketing & Growth",
    "finance": "Finance & Tax",
    "health": "Health & Wellness",
    "legal": "Legal & Compliance",
    "product": "Product Management",
    "data": "Data & Analytics",
  };

  const clean = category.trim().toLowerCase();
  if (catMap[clean]) return catMap[clean];

  return category
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getStoredSeekerProfile(): SeekerProfileData {
  if (typeof window === "undefined") {
    return {
      name: SEEKER_PROFILE.name,
      avatar: SEEKER_PROFILE.avatar,
      category: "",
      isPro: SEEKER_PROFILE.isPro,
    };
  }

  try {
    const raw = localStorage.getItem(SEEKER_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SeekerProfileData;
      return {
        name: parsed.name || SEEKER_PROFILE.name,
        avatar: parsed.avatar || SEEKER_PROFILE.avatar,
        category: parsed.category || sessionStorage.getItem("jatayu_seeker_category") || "",
        isPro: parsed.isPro ?? SEEKER_PROFILE.isPro,
        email: parsed.email,
        phone: parsed.phone,
      };
    }
  } catch {
    // Ignore JSON errors
  }

  return {
    name: SEEKER_PROFILE.name,
    avatar: SEEKER_PROFILE.avatar,
    category: sessionStorage.getItem("jatayu_seeker_category") || "",
    isPro: SEEKER_PROFILE.isPro,
  };
}

export function saveStoredSeekerProfile(data: Partial<SeekerProfileData>): void {
  if (typeof window === "undefined") return;
  const current = getStoredSeekerProfile();
  const updated: SeekerProfileData = {
    ...current,
    ...data,
  };
  localStorage.setItem(SEEKER_PROFILE_STORAGE_KEY, JSON.stringify(updated));
  if (data.category) {
    sessionStorage.setItem("jatayu_seeker_category", data.category);
  }
  window.dispatchEvent(new Event(SEEKER_PROFILE_UPDATED_EVENT));
}

export function mapBackendSeekerToProfile(
  data: BackendSeekerProfile,
): SeekerProfileData {
  return {
    name: data.fullName || data.name || SEEKER_PROFILE.name,
    avatar: data.profilePhotoSrc || data.avatarUrl || data.avatar || SEEKER_PROFILE.avatar,
    category: data.category || data.selectedCategory || data.categoryName || "",
    isPro: data.isPro ?? SEEKER_PROFILE.isPro,
    email: data.email,
    phone: data.phone,
  };
}

export async function fetchSeekerProfileData(): Promise<SeekerProfileData> {
  const backendData = (await getSeekerProfile()) as BackendSeekerProfile;
  const mapped = mapBackendSeekerToProfile(backendData);
  saveStoredSeekerProfile(mapped);
  return mapped;
}
